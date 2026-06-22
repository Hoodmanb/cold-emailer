const fs = require('fs');
const documentRepo = require('../repositories/documentRepository');
const documentRegistry = require('../services/document/documentRegistry');
const { log, ACTION_TYPES } = require('../logs/auditLogger');
const aiService = require('../services/aiService');
const documentExporter = require('../utils/documentExporter');
const documentEngine = require('../services/document/documentEngine');
const { castToModel } = require('../services/document/models');
const { validate } = require('../services/document/validator');
const templateService = require('../services/templates/templateService');
const { resolvePipelineTemplate } = require('../domains/ai/core/templateContext');
const {
  getEditableContent,
  normalizeFormat,
  recordExport,
} = require('../services/document/documentPersistenceService');
const { requireUserId } = require('../utils/requireUserId');

const listDocuments = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { jobId } = req.query;
  const docs = await documentRepo.listDocuments(jobId, userId);
  return res.status(200).json({ message: 'retrieved successfully', data: docs });
};

const getDocument = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const doc = await documentRepo.getDocument(req.params.id, userId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  return res.status(200).json({ message: 'retrieved successfully', data: doc });
};

const saveDocument = async (req, res) => {
  const doc = await documentRegistry.createDocument({ ...req.body, source: 'manual' });
  return res.status(201).json({ message: 'created successfully', data: doc });
};

const updateDocument = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { id } = req.params;
  const existing = await documentRepo.getDocument(id, userId);
  if (!existing) return res.status(404).json({ message: 'Document not found' });

  const prevContent = getEditableContent(existing);
  const updated = await documentRepo.updateDocument(id, req.body, userId);
  const nextContent = getEditableContent(updated);

  if (nextContent !== prevContent) {
    await log(ACTION_TYPES.DRAFT_EDITED, {
      module: existing.type,
      entityId: id,
      entityType: 'document',
      details: 'Document content manually edited',
    });
  }

  return res.status(200).json({ message: 'updated successfully', data: updated });
};

const renameDocument = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { id } = req.params;
  const { title } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  const existing = await documentRepo.getDocument(id, userId);
  if (!existing) return res.status(404).json({ message: 'Document not found' });
  const updated = await documentRepo.updateDocument(id, { title: String(title).trim() }, userId);
  return res.status(200).json({ message: 'renamed successfully', data: updated });
};

const duplicateDocumentHandler = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const copy = await documentRepo.duplicateDocument(req.params.id, userId);
  if (!copy) return res.status(404).json({ message: 'Document not found' });
  await log(ACTION_TYPES.DOCUMENT_GENERATED, {
    module: 'documents',
    entityId: copy.id,
    entityType: 'document',
    details: `Document duplicated from ${req.params.id}`,
  });
  return res.status(201).json({ message: 'duplicated successfully', data: copy });
};

const approveDocument = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { id } = req.params;
  const doc = await documentRepo.getDocument(id, userId);
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  const approved = await documentRepo.approveDocument(id, userId);

  await log(ACTION_TYPES.DRAFT_APPROVED, {
    module: doc.type,
    entityId: id,
    entityType: 'document',
    details: `${doc.type} approved by user`,
  });

  return res.status(200).json({ message: 'Document approved', data: approved });
};

const listResumeTemplatesHandler = async (req, res) => {
  try {
    const { listResumeTemplatesAsync } = require('../services/document/resumeTemplateRegistry');
    const data = await listResumeTemplatesAsync();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const renderResume = async (req, res, next) => {
  try {
    const { model, format = 'pdf', resumeTemplateId } = req.body || {};
    if (!model || typeof model !== 'object') {
      return res.status(400).json({ success: false, message: 'model is required (resume JSON matching resume_generation schema)' });
    }
    const fmt = String(format || 'pdf').toLowerCase();
    if (!['pdf', 'html', 'docx'].includes(fmt)) {
      return res.status(400).json({ success: false, message: 'format must be pdf, html, or docx' });
    }
    const v = validate('resume_generation', model);
    if (!v.valid) {
      return res.status(400).json({ success: false, message: 'Resume model validation failed', errors: v.errors });
    }
    const normalized = castToModel('resume_generation', model);
    const artifact = await documentEngine.generateDocument({
      featureId: 'resume_generation',
      model: normalized,
      format: fmt,
      userId: req.user?.id,
      themeId: resumeTemplateId,
    });
    const absPath = documentEngine.resolveArtifactPath(artifact.filePath);
    const stream = fs.createReadStream(absPath);
    stream.on('error', (err) => {
      if (!res.headersSent) next(err);
    });
    res.setHeader('Content-Type', artifact.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.fileName}"`);
    res.setHeader('X-Resume-Template-File', artifact.templateName || '');
    return stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const count = await documentRepo.deleteDocument(req.params.id, userId);
  if (count === 0) return res.status(404).json({ message: 'Document not found' });

  await log(ACTION_TYPES.DOCUMENT_DELETED, { entityId: req.params.id, entityType: 'document' });
  return res.status(200).json({ message: 'deleted successfully' });
};

function resolveFeatureIdForDocType(docType) {
  const t = String(docType || '').toLowerCase().replace(/\s+/g, '-');
  if (t.includes('professional-cv') || t === 'cv' || t.includes('professional-cv')) return 'professional_cv_generation';
  if (t.includes('cover-letter') || t.includes('cover-letter')) return 'cover_letter_generation';
  if (t === 'resume' || t.includes('resume')) return 'resume_generation';
  return 'advanced_doc_generation';
}

function resolveDocumentType(docType) {
  const t = String(docType || '').toLowerCase();
  if (t.includes('professional cv') || t === 'professional-cv' || t === 'cv') return 'professional-cv';
  if (t.includes('cover letter') || t === 'cover-letter') return 'cover-letter';
  if (t.includes('resume')) return 'resume';
  return String(docType || 'custom').toLowerCase().replace(/\s+/g, '-');
}

const generateAdvanced = async (req, res, next) => {
  try {
    const {
      docType,
      userData,
      targetAudience,
      templateStyle,
      additionalInstructions,
      format = 'pdf',
      jobId,
      tailoringLevel = 'balanced',
      templateId,
    } = req.body;

    const featureId = resolveFeatureIdForDocType(docType);
    const documentType = resolveDocumentType(docType);

    const safeFormat = normalizeFormat(format, 'pdf');
    let content = '';
    const template = templateId
      ? await templateService.resolveTemplateForGeneration(templateId, documentType)
      : null;
    const aiOptions = { tailoringLevel, templateId: template?.id || templateId || undefined };

    if (featureId === 'professional_cv_generation') {
      content = await aiService.generateProfessionalCv(userData || {}, aiOptions);
    } else if (featureId === 'resume_generation') {
      const { promptSuffix: templateSuffix, postProcess } = await resolvePipelineTemplate(aiOptions, 'resume');
      const promptRegistry = require('../domains/ai/core/promptRegistry');
      const promptTemplate = await promptRegistry.resolvePrompt('resume_generation');
      const rendered = promptRegistry.render(promptTemplate, {
        job_description: additionalInstructions || 'General resume generation from profile.',
        candidate_profile: JSON.stringify(userData || {}, null, 2),
      });
      const result = await aiService.generateForFeature({
        featureId: 'resume_generation',
        prompt: `${rendered}${templateSuffix}`,
        options: { temperature: 0.4, max_tokens: 2500 },
      });
      const raw = typeof result?.data === 'string' ? result.data : String(result?.data || '');
      content = postProcess(raw);
    } else if (featureId === 'cover_letter_generation') {
      const { promptSuffix: templateSuffix, postProcess } = await resolvePipelineTemplate(aiOptions, 'cover-letter');
      const prompt = [
        `Generate a cover letter document.`,
        targetAudience ? `Target audience: ${targetAudience}` : '',
        templateStyle ? `Style: ${templateStyle}` : '',
        additionalInstructions ? `Instructions: ${additionalInstructions}` : '',
        userData ? `User data:\n${JSON.stringify(userData, null, 2)}` : '',
        templateSuffix,
      ].filter(Boolean).join('\n\n');

      const result = await aiService.generateForFeature({
        featureId: 'cover_letter_generation',
        prompt,
        options: { temperature: 0.5, max_tokens: 2500 },
      });
      const raw = typeof result?.data === 'string' ? result.data : String(result?.data || '');
      content = postProcess(raw);
    } else {
      const prompt = [
        `Generate a ${docType} document.`,
        targetAudience ? `Target audience: ${targetAudience}` : '',
        templateStyle ? `Style: ${templateStyle}` : '',
        additionalInstructions ? `Instructions: ${additionalInstructions}` : '',
        userData ? `User data:\n${JSON.stringify(userData, null, 2)}` : '',
      ].filter(Boolean).join('\n\n');

      const result = await aiService.generateForFeature({
        featureId,
        prompt,
        options: { temperature: 0.5, max_tokens: 2500 },
      });
      content = typeof result?.data === 'string' ? result.data : String(result?.data || '');
    }

    const cfg = await aiService.resolveFeatureConfig(featureId);
    const doc = await documentRegistry.createDocument({
      jobId: jobId || null,
      generatedFromJobId: jobId || null,
      type: documentType,
      editableContent: content,
      content,
      contentSource: 'ai',
      status: 'draft',
      format: safeFormat,
      exportFormat: safeFormat,
      model: cfg.model,
      tailoringLevel,
      source: 'advanced-generation',
      title: `${docType || documentType} — ${userData?.name || 'Document'}`,
      templateId: template?.id,
      templateName: template?.name,
      metadata: { featureId, targetAudience, templateStyle, templateId: template?.id, templateName: template?.name },
    });

    await log(ACTION_TYPES.DOCUMENT_GENERATED, {
      module: 'documents',
      entityId: doc.id,
      entityType: 'document',
      details: `Advanced document generated: ${docType} via ${featureId}`,
    });

    return res.status(201).json({ success: true, message: 'generated successfully', data: doc });
  } catch (err) {
    next(err);
  }
};

const generateProfessionalCv = async (req, res, next) => {
  try {
    const {
      profile,
      jobId,
      jobContext,
      format = 'pdf',
      tailoringLevel = 'balanced',
      title,
      templateId,
    } = req.body;

    const safeFormat = normalizeFormat(format, 'pdf');
    const template = templateId
      ? await templateService.resolveTemplateForGeneration(templateId, 'professional-cv')
      : null;
    const aiOptions = { tailoringLevel, templateId: template?.id || templateId || undefined };
    const content = jobContext
      ? await aiService.generateProfessionalCv(jobContext, profile || {}, aiOptions)
      : await aiService.generateProfessionalCv(profile || {}, aiOptions);

    const cfg = await aiService.resolveFeatureConfig('professional_cv_generation');
    const doc = await documentRegistry.createDocument({
      jobId: jobId || null,
      generatedFromJobId: jobId || null,
      type: 'professional-cv',
      editableContent: content,
      content,
      contentSource: 'ai',
      format: safeFormat,
      exportFormat: safeFormat,
      status: 'draft',
      model: cfg.model,
      tailoringLevel,
      source: 'widget',
      title: title || `Professional CV — ${profile?.name || 'Document'}`,
      templateId: template?.id,
      templateName: template?.name,
      metadata: { featureId: 'professional_cv_generation', templateId: template?.id, templateName: template?.name },
    });

    await log(ACTION_TYPES.DOCUMENT_GENERATED, {
      module: 'documents',
      entityId: doc.id,
      entityType: 'document',
      details: 'Professional CV generated',
    });

    return res.status(201).json({ success: true, message: 'Professional CV generated', data: doc });
  } catch (err) {
    next(err);
  }
};

async function sendExportedDocument(res, doc, format, { inline = false } = {}) {
  const safeFormat = normalizeFormat(format, doc.exportFormat || doc.format || 'pdf');
  const sourceContent = getEditableContent(doc);
  const exported = await documentExporter.exportToFormat(sourceContent, safeFormat);

  const slugTitle = (doc.title || doc.type)
    .replace(/[^a-z0-9\-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 60);
  const filename = `${slugTitle || doc.type}_${doc.id.substring(0, 8)}.${safeFormat}`;
  const disposition = inline ? 'inline' : 'attachment';

  if (safeFormat === 'docx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    return res.send(exported);
  }
  if (safeFormat === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    return res.send(exported);
  }
  if (safeFormat === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(exported);
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  return res.send(exported);
}

const downloadDocument = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const doc = await documentRepo.getDocument(id, userId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const format = String(req.query.format || doc.exportFormat || doc.format || 'pdf').toLowerCase();
    const inline = req.query.inline === 'true';

    const history = recordExport(doc, format);
    await documentRepo.updateDocument(id, { exportHistory: history }, userId);

    return sendExportedDocument(res, doc, format, { inline });
  } catch (err) {
    next(err);
  }
};

const exportDocument = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const { format } = req.body || {};
    const doc = await documentRepo.getDocument(id, userId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const safeFormat = normalizeFormat(format, doc.exportFormat || doc.format || 'pdf');
    const history = recordExport(doc, safeFormat);
    await documentRepo.updateDocument(id, { exportHistory: history, exportFormat: safeFormat, format: safeFormat }, userId);

    return sendExportedDocument(res, doc, safeFormat, { inline: false });
  } catch (err) {
    next(err);
  }
};

const previewDocument = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const { format } = req.query;
    const doc = await documentRepo.getDocument(id, userId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const previewFormat = String(format || doc.exportFormat || doc.format || 'pdf').toLowerCase();

    if (previewFormat === 'pdf') {
      const sourceContent = getEditableContent(doc);
      const pdfBuffer = await documentExporter.exportToFormat(sourceContent, 'pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return res.send(pdfBuffer);
    }

    const sourceContent = getEditableContent(doc);
    const html = await documentExporter.exportToFormat(sourceContent, 'html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  renameDocument,
  duplicateDocument: duplicateDocumentHandler,
  approveDocument,
  deleteDocument,
  generateAdvanced,
  generateProfessionalCv,
  downloadDocument,
  exportDocument,
  previewDocument,
  listResumeTemplates: listResumeTemplatesHandler,
  renderResume,
};
