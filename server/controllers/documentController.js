const fs = require('fs');
const documentRepo = require('../repositories/documentRepository');
const { log, ACTION_TYPES } = require('../logs/auditLogger');
const aiService = require('../services/aiService');
const documentExporter = require('../utils/documentExporter');
const documentEngine = require('../services/document/documentEngine');
const { castToModel } = require('../services/document/models');
const { validate } = require('../services/document/validator');
const { listResumeTemplates } = require('../services/document/resumeTemplateRegistry');

const listDocuments = (req, res) => {
  const { jobId } = req.query;
  const docs = documentRepo.listDocuments(jobId);
  return res.status(200).json({ message: 'retrieved successfully', data: docs });
};

const getDocument = (req, res) => {
  const doc = documentRepo.getDocument(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  return res.status(200).json({ message: 'retrieved successfully', data: doc });
};

const saveDocument = (req, res) => {
  const doc = documentRepo.saveDocument(req.body);
  return res.status(201).json({ message: 'created successfully', data: doc });
};

const updateDocument = (req, res) => {
  const { id } = req.params;
  const existing = documentRepo.getDocument(id);
  if (!existing) return res.status(404).json({ message: 'Document not found' });

  const wasEdited = req.body.content !== undefined && req.body.content !== existing.content;
  const updated = documentRepo.updateDocument(id, req.body);

  if (wasEdited) {
    log(ACTION_TYPES.DRAFT_EDITED, {
      module: existing.type,
      entityId: id,
      entityType: 'document',
      details: 'Document content manually edited',
    });
  }

  return res.status(200).json({ message: 'updated successfully', data: updated });
};

const approveDocument = (req, res) => {
  const { id } = req.params;
  const doc = documentRepo.getDocument(id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  const approved = documentRepo.approveDocument(id);

  log(ACTION_TYPES.DRAFT_APPROVED, {
    module: doc.type,
    entityId: id,
    entityType: 'document',
    details: `${doc.type} approved by user`,
  });

  return res.status(200).json({ message: 'Document approved', data: approved });
};

const listResumeTemplatesHandler = (req, res) => {
  try {
    return res.status(200).json({ success: true, data: listResumeTemplates() });
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
      resumeTemplateId,
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

const deleteDocument = (req, res) => {
  const count = documentRepo.deleteDocument(req.params.id);
  if (count === 0) return res.status(404).json({ message: 'Document not found' });

  log(ACTION_TYPES.DOCUMENT_DELETED, { entityId: req.params.id, entityType: 'document' });
  return res.status(200).json({ message: 'deleted successfully' });
};

const generateAdvanced = async (req, res, next) => {
  try {
    const { 
      docType, 
      userData, 
      targetAudience, 
      templateStyle, 
      additionalInstructions,
      format = 'markdown',
      jobId 
    } = req.body;
    
    console.log(`[DOC_GEN] Request: ${docType} for user ${req.user?.id || 'unknown'}`);
    console.log(`[DOC_GEN] Data: ${userData?.experience?.length || 0} exp, ${userData?.projects?.length || 0} projects`);

    const result = await aiService.generateAdvancedDocument({
      docType,
      userData,
      targetAudience,
      templateStyle,
      additionalInstructions
    });

    const doc = documentRepo.saveDocument({
      jobId,
      type: docType.toLowerCase().replace(/\s+/g, '-'),
      content: result,
      status: 'draft',
      format,
    });

    log(ACTION_TYPES.DOCUMENT_GENERATED, {
      module: 'documents',
      entityId: doc.id,
      entityType: 'document',
      details: `Advanced document generated: ${docType}`,
    });

    console.log(`[DOC_GEN] Success: Created document ${doc.id}`);
    return res.status(201).json({ success: true, message: 'generated successfully', data: doc });
  } catch (err) {
    next(err);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'markdown' } = req.query;
    const doc = documentRepo.getDocument(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const exported = await documentExporter.exportToFormat(doc.content, format);

    const filename = `${doc.type.replace(/\s+/g, '_')}_${id}.${format}`;
    
    if (format === 'docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(exported);
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(exported);
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(exported);
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(exported);
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(exported);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  listDocuments, 
  getDocument, 
  saveDocument, 
  updateDocument, 
  approveDocument, 
  deleteDocument,
  generateAdvanced,
  downloadDocument,
  listResumeTemplates: listResumeTemplatesHandler,
  renderResume,
};
