// server/repositories/documentTemplateRepository.js
/**
 * Document Template Repository
 * Maps the document_templates table to the application domain model.
 * 
 * DB Schema:
 * - id: uuid
 * - user_id: uuid (nullable)
 * - name: text
 * - content: jsonb (stores layout, blocks, style, type, status, is_public, etc.)
 * - is_global: boolean (maps to isAdminTemplate)
 * - created_by: uuid (nullable)
 * - created_at: timestamp
 * - updated_at: timestamp
 */

const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

const TABLE = 'document_templates';

const VALID_TYPES = new Set(['resume', 'cv', 'cover_letter', 'cover letter', 'email']);
const VALID_STATUSES = new Set(['draft', 'pending_approval', 'approved', 'rejected']);

function normalizeType(type) {
  if (!type) return 'resume';
  const t = String(type).toLowerCase().trim();
  if (t === 'cover letter' || t === 'cover-letter') return 'cover_letter';
  if (t === 'professional-cv' || t === 'professional_cv') return 'cv';
  return VALID_TYPES.has(t) ? t : 'resume';
}

function fromRow(row) {
  if (!row) return null;
  
  const content = row.content && typeof row.content === 'object' ? row.content : {};
  const now = new Date().toISOString();
  
  return {
    id: row.id,
    userId: row.user_id || row.created_by || null,
    createdBy: row.created_by || row.user_id || null,
    name: row.name || 'Untitled Template',
    description: content.description || '',
    type: normalizeType(content.type),
    
    // Layout/Blocks/Style stored in content JSONB
    layout: content.layout || { type: 'single-column', blocks: ['profile', 'experience', 'education', 'skills'] },
    blocks: content.blocks || {
      profile: { type: 'profile', title: 'Profile' },
      experience: { type: 'experience', title: 'Experience' },
      education: { type: 'education', title: 'Education' },
      skills: { type: 'skills', title: 'Skills' }
    },
    style: content.style || {
      fontFamily: 'Inter, "Segoe UI", sans-serif',
      primaryColor: '#111111',
      fontSize: 12,
      spacing: 12
    },
    
    // Approval workflow stored in content JSONB
    status: content.status || 'draft',
    approvalStatus: content.approvalStatus || content.status || 'draft',
    isPublic: content.isPublic === true || content.is_public === true,
    isAdminTemplate: row.is_global === true,
    isApproved: content.approvalStatus === 'approved' || content.status === 'approved',
    
    // Metadata
    featured: content.featured === true,
    category: content.category || null,
    version: content.version || 1,
    preview: content.preview || null,
    aiRules: content.aiRules || null,
    
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || now,
    approvedAt: content.approvedAt || content.approved_at || null,
    rejectedAt: content.rejectedAt || content.rejected_at || null,
    rejectionReason: row.rejection_reason || content.rejectionReason || content.rejection_reason || null,
    approvedBy: row.approved_by || content.approvedBy || content.approved_by || null,
    rejectedBy: row.rejected_by || content.rejectedBy || content.rejected_by || null,
    
    // Raw content for advanced use
    content: content,
  };
}

function toRow(template, userId) {
  const now = new Date().toISOString();
  const id = template.id || uuidv4();
  
  // Build content JSONB with all template data
  const content = {
    ...(template.content || {}),
    description: template.description,
    type: normalizeType(template.type),
    layout: template.layout,
    blocks: template.blocks,
    style: template.style,
    status: template.status || template.approvalStatus || 'draft',
    approvalStatus: template.approvalStatus || template.status || 'draft',
    isPublic: template.isPublic === true,
    is_public: template.isPublic === true,
    featured: template.featured === true,
    category: template.category,
    version: template.version || 1,
    preview: template.preview,
    aiRules: template.aiRules,
    approvedAt: template.approvedAt || null,
    approved_at: template.approvedAt || null,
    rejectedAt: template.rejectedAt || null,
    rejected_at: template.rejectedAt || null,
    rejectionReason: template.rejectionReason || null,
    rejection_reason: template.rejectionReason || null,
    approvedBy: template.approvedBy || null,
    approved_by: template.approvedBy || null,
    rejectedBy: template.rejectedBy || null,
    rejected_by: template.rejectedBy || null,
  };
  
  return {
    id,
    user_id: userId || template.userId || template.createdBy || null,
    name: template.name || 'Untitled Template',
    content,
    is_global: template.isAdminTemplate === true || template.is_global === true,
    created_by: template.createdBy || userId || template.userId || null,
    created_at: template.createdAt || now,
    updated_at: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public/Visibility helpers
// ─────────────────────────────────────────────────────────────────────────────

function isVisibleToPublic(template) {
  if (!template) return false;
  // Admin templates are always visible
  if (template.isAdminTemplate || template.is_global) return true;
  // Public AND approved templates are visible
  if (template.isPublic && template.status === 'approved') return true;
  if (template.isPublic && template.approvalStatus === 'approved') return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────────────────────

async function listAll() {
  const { data, error } = await Supabase.selectAll(TABLE);
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function listForUser(userId) {
  if (!userId) return [];
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function listPublic() {
  // Fetch all and filter in memory because visibility logic is complex
  // In production, this should use a database view or computed column
  const { data, error } = await Supabase.selectAll(TABLE);
  if (error) throw error;
  const templates = (data || []).map(fromRow);
  return templates.filter(isVisibleToPublic);
}

async function listApprovedPublic() {
  const all = await listAll();
  return all.filter(t => 
    (t.status === 'approved' || t.approvalStatus === 'approved') && 
    (t.isPublic || t.isAdminTemplate)
  );
}

async function listCommunityForUser(userId) {
  const all = await listAll();
  return all.filter(t => 
    t.userId !== userId && 
    isVisibleToPublic(t)
  );
}

async function listPendingApproval() {
  const all = await listAll();
  return all.filter(t => 
    t.status === 'pending_approval' || 
    t.approvalStatus === 'pending_approval'
  );
}

async function getById(id) {
  if (!id) return null;
  const { data, error } = await Supabase.selectOne(TABLE, { id });
  if (error) throw error;
  return fromRow(data);
}

async function create(templateData, userId) {
  const row = toRow(templateData, userId);
  const insertRow = {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    content: row.content,
    is_global: row.is_global,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  const result = await Supabase.insert(TABLE, insertRow);
  if (result.error) throw result.error;
  return fromRow(result.data?.[0] || row);
}

async function update(id, updates, userId) {
  const current = await getById(id);
  if (!current) return null;
  
  // Check authorization if userId provided
  if (userId && !current.isAdminTemplate) {
    const isOwner = String(current.userId) === String(userId);
    if (!isOwner) {
      throw new Error('Not authorized to update this template');
    }
  }
  
  const row = toRow({ ...current, ...updates, id }, userId);
  const payload = {
    name: row.name,
    content: row.content,
    is_global: row.is_global,
    updated_at: row.updated_at,
  };

  const result = await Supabase.update(TABLE, { id }, payload, userId);
  if (result.error) throw result.error;
  return fromRow(result.data?.[0] || row);
}

async function remove(id, userId) {
  const current = await getById(id);
  if (!current) return false;
  
  // Check authorization
  if (userId && !current.isAdminTemplate) {
    const isOwner = String(current.userId) === String(userId);
    if (!isOwner) {
      throw new Error('Not authorized to delete this template');
    }
  }
  
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return (data || []).length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Approval Workflow
// ─────────────────────────────────────────────────────────────────────────────

async function submitForApproval(id, userId) {
  const template = await getById(id);
  if (!template) throw new Error('Template not found');
  
  if (String(template.userId) !== String(userId)) {
    throw new Error('Not authorized to submit this template');
  }
  
  return update(id, {
    isPublic: true,
    status: 'pending_approval',
    approvalStatus: 'pending_approval',
  }, userId);
}

async function approve(id, adminUserId) {
  const template = await getById(id);
  if (!template) throw new Error('Template not found');
  
  const now = new Date().toISOString();
  return update(id, {
    status: 'approved',
    approvalStatus: 'approved',
    isApproved: true,
    approvedAt: now,
    approvedBy: adminUserId,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
  }, adminUserId);
}

async function reject(id, adminUserId, reason) {
  const template = await getById(id);
  if (!template) throw new Error('Template not found');
  
  const now = new Date().toISOString();
  return update(id, {
    status: 'rejected',
    approvalStatus: 'rejected',
    isApproved: false,
    rejectedAt: now,
    rejectedBy: adminUserId,
    rejectionReason: reason || 'No reason provided',
    approvedAt: null,
    approvedBy: null,
  }, adminUserId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Operations
// ─────────────────────────────────────────────────────────────────────────────

async function setAdminTemplate(id, isAdmin = true) {
  const { data, error } = await Supabase.update(TABLE, { id }, {
    is_global: isAdmin,
  });
  if (error) throw error;
  return fromRow(data?.[0]);
}

async function seedTemplate(templateData) {
  // Check if template with same name exists
  const all = await listAll();
  const existing = all.find(t => t.name === templateData.name && t.isAdminTemplate);
  if (existing) return existing;
  
  const row = toRow({
    ...templateData,
    isAdminTemplate: true,
    isPublic: true,
    status: 'approved',
    approvalStatus: 'approved',
    isApproved: true,
  }, null);
  
  row.is_global = true;
  row.user_id = null;
  row.created_by = null;
  
  const { data, error } = await Supabase.insert(TABLE, row);
  if (error) throw error;
  return fromRow(data?.[0] || row);
}

async function upsertMany(templates) {
  const results = [];
  for (const template of templates) {
    try {
      // Check if exists by ID
      const existing = template.id ? await getById(template.id) : null;
      if (existing) {
        const updated = await update(existing.id, template, null);
        results.push(updated);
      } else {
        // Check by name for admin templates
        const all = await listAll();
        const byName = all.find(t => t.name === template.name && t.isAdminTemplate);
        if (byName) {
          const updated = await update(byName.id, template, null);
          results.push(updated);
        } else {
          const created = await seedTemplate(template);
          results.push(created);
        }
      }
    } catch (err) {
      console.error(`[documentTemplateRepository.upsertMany] Failed for ${template.name}:`, err.message);
    }
  }
  return results.filter(Boolean);
}

module.exports = {
  TABLE,
  fromRow,
  toRow,
  normalizeType,
  isVisibleToPublic,
  
  // CRUD
  listAll,
  listForUser,
  listPublic,
  listApprovedPublic,
  listCommunityForUser,
  listPendingApproval,
  getById,
  create,
  update,
  remove,
  
  // Approval workflow
  submitForApproval,
  approve,
  reject,
  
  // Admin
  setAdminTemplate,
  seedTemplate,
  upsertMany,
};
