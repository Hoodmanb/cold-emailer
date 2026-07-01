/**
 * Unified Template domain model.
 * Variants: email | document (includes system/community/official via source).
 */

const { enrichTemplateWithStructure } = require('../utils/structure');
const { resolveLifecycle, LIFECYCLE } = require('../utils/lifecycle');

const TEMPLATE_SOURCES = Object.freeze({
  USER: 'user',
  OFFICIAL: 'official',
  COMMUNITY: 'community',
  SYSTEM: 'system',
  LEGACY: 'legacy',
});

const TEMPLATE_TYPES = Object.freeze({
  EMAIL: 'email',
  RESUME: 'resume',
  CV: 'cv',
  COVER_LETTER: 'cover_letter',
  DOCUMENT: 'document',
});

function mapEmailRow(row) {
  if (!row) return null;
  const lifecycle = resolveLifecycle({ approvalStatus: row.approvalStatus || LIFECYCLE.APPROVED });
  return {
    id: row.id,
    name: row.name || '',
    ownerId: row.userId || null,
    status: lifecycle,
    lifecycle,
    source: TEMPLATE_SOURCES.USER,
    templateType: TEMPLATE_TYPES.EMAIL,
    content: {
      subject: row.subject || '',
      body: row.body || '',
      type: row.type || 'email',
    },
    preview: null,
    metadata: {
      isPublic: row.isPublic === true,
      usageCount: row.usageCount || 0,
      lastUsedAt: row.lastUsedAt || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    // Legacy flat fields
    subject: row.subject || '',
    body: row.body || '',
    userId: row.userId,
    isPublic: row.isPublic === true,
    usageCount: row.usageCount || 0,
    approvalStatus: lifecycle === LIFECYCLE.PUBLISHED ? 'approved' : lifecycle,
  };
}

function mapDocumentRow(row) {
  if (!row) return null;
  const enriched = enrichTemplateWithStructure(row);
  const lifecycle = resolveLifecycle(enriched);

  let source = TEMPLATE_SOURCES.USER;
  if (enriched.isAdminTemplate) source = TEMPLATE_SOURCES.OFFICIAL;
  else if (enriched.isPublic && lifecycle === LIFECYCLE.PUBLISHED) source = TEMPLATE_SOURCES.COMMUNITY;
  else if (enriched.isPublic) source = TEMPLATE_SOURCES.COMMUNITY;

  return {
    id: enriched.id,
    name: enriched.name || 'Untitled Template',
    ownerId: enriched.userId || enriched.createdBy || null,
    status: lifecycle,
    lifecycle,
    source,
    templateType: enriched.type || TEMPLATE_TYPES.RESUME,
    content: {
      layout: enriched.layout,
      blocks: enriched.blocks,
      style: enriched.style,
      aiRules: enriched.aiRules || null,
      promptRules: enriched.promptRules || enriched.aiRules || null,
      description: enriched.description || '',
      placeholders: enriched.placeholders || [],
    },
    preview: enriched.preview || null,
    metadata: {
      category: enriched.category,
      version: enriched.version || 1,
      featured: enriched.featured === true,
      isPublic: enriched.isPublic === true,
      isAdminTemplate: enriched.isAdminTemplate === true,
      rejectionReason: enriched.rejectionReason,
      approvedAt: enriched.approvedAt,
      rejectedAt: enriched.rejectedAt,
      createdAt: enriched.createdAt,
      updatedAt: enriched.updatedAt,
    },
    // Legacy flat fields for existing consumers
    ...enriched,
    structure: enriched.structure,
    approvalStatus: enriched.approvalStatus || enriched.status,
    userId: enriched.userId,
    createdBy: enriched.createdBy,
  };
}

function toSystemTemplateDto(domainTemplate) {
  const t = domainTemplate;
  return {
    id: t.id,
    slug: t.id,
    name: t.name,
    category: t.templateType || t.type || 'resume',
    theme: t.content?.style?.theme || t.style?.theme || 'default',
    preview: `/api/system-templates/${t.id}/preview`,
    description: t.content?.description || t.description || '',
    version: t.metadata?.version || t.version || 1,
    engine: 'json',
    tags: t.metadata?.isPublic ? ['public', 'approved'] : [],
    supportedDocuments: [t.templateType || t.type || 'resume'],
    premium: t.metadata?.featured || t.featured || false,
    supports: {
      ats: true,
      multiPage: true,
      coverLetter: (t.templateType || t.type) === 'cover_letter',
    },
    layout: t.content?.layout || t.layout,
    blocks: t.content?.blocks || t.blocks,
    style: t.content?.style || t.style,
  };
}

module.exports = {
  TEMPLATE_SOURCES,
  TEMPLATE_TYPES,
  LIFECYCLE,
  mapEmailRow,
  mapDocumentRow,
  toSystemTemplateDto,
};
