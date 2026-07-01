// server/controllers/documentTemplateController.js
/**
 * Document Template Controller
 * Handles all document template CRUD and approval workflow endpoints
 */

const documentTemplateRepo = require('../repositories/documentTemplateRepository');
const templateService = require('../services/templates/templateService');
const { requireUserId } = require('../utils/requireUserId');
const { getCurrentUserId } = require('../middleware/requestContext');
const { findUserById } = require('../repositories/userRepository');
const { renderTemplate } = require('../utils/renderJsonTemplate');
const { templateListResponse } = require('../domains/templates/utils/apiResponse');
const { mapDocumentRow } = require('../domains/templates/models/templateDomain');

// ─────────────────────────────────────────────────────────────────────────────
// Template CRUD
// ─────────────────────────────────────────────────────────────────────────────

async function listTemplates(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  try {
    const templates = await documentTemplateRepo.listForUser(userId);
    const starredIds = await templateService.getUserStarredIds(userId);
    const items = templates.map(mapDocumentRow);
    const payload = templateListResponse(items, { starredIds });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[documentTemplateController.listTemplates] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list templates',
      error: error.message,
    });
  }
}

async function listUserTemplatesHandler(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  const targetUserId = req.params.id;
  const currentUser = await findUserById(userId);
  const isAdmin = currentUser?.role === 'admin';
  
  if (String(userId) !== String(targetUserId) && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these templates',
    });
  }
  
  try {
    const templates = await documentTemplateRepo.listAll();
    const userTemplates = templates.filter(t => String(t.userId) === String(targetUserId));
    return res.status(200).json({
      success: true,
      data: userTemplates,
      count: userTemplates.length,
    });
  } catch (error) {
    console.error('[documentTemplateController.listUserTemplatesHandler] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list user templates',
      error: error.message,
    });
  }
}

async function getTemplate(req, res) {
  const userId = getCurrentUserId();
  
  try {
    const template = await documentTemplateRepo.getById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Check visibility
    const isOwner = userId && String(template.userId) === String(userId);
    const isVisible = template.isAdminTemplate || 
                      (template.isPublic && template.status === 'approved') ||
                      isOwner;
    
    if (!isVisible) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this template',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.getTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message,
    });
  }
}

async function createTemplateHandler(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  const {
    name,
    description,
    type,
    layout,
    blocks,
    style,
    isPublic,
    category,
    aiRules,
  } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Template name is required',
    });
  }
  
  try {
    const template = await documentTemplateRepo.create({
      name,
      description,
      type,
      layout,
      blocks,
      style,
      isPublic: isPublic === true,
      status: 'draft',
      approvalStatus: 'draft',
      category,
      aiRules,
    }, userId);
    
    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.createTemplateHandler] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
}

async function updateTemplateHandler(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  const { id } = req.params;
  const {
    name,
    description,
    type,
    layout,
    blocks,
    style,
    isPublic,
    category,
    aiRules,
  } = req.body;
  
  try {
    const existing = await documentTemplateRepo.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Check ownership
    if (String(existing.userId) !== String(userId)) {
      const user = await findUserById(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this template',
        });
      }
    }
    
    // Prevent editing approved public templates unless admin
    if (existing.status === 'approved' && existing.isPublic && !existing.isAdminTemplate) {
      const user = await findUserById(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit approved public templates. Create a copy instead.',
        });
      }
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (layout !== undefined) updates.layout = layout;
    if (blocks !== undefined) updates.blocks = blocks;
    if (style !== undefined) updates.style = style;
    if (category !== undefined) updates.category = category;
    if (aiRules !== undefined) updates.aiRules = aiRules;
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
      const user = await findUserById(userId);
      if (user?.role !== 'admin' && isPublic) {
        updates.status = 'pending_approval';
        updates.approvalStatus = 'pending_approval';
      }
    }
    
    const template = await documentTemplateRepo.update(id, updates, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.updateTemplateHandler] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message,
    });
  }
}

async function deleteTemplateHandler(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  const { id } = req.params;
  
  try {
    const existing = await documentTemplateRepo.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Check ownership
    if (String(existing.userId) !== String(userId)) {
      const user = await findUserById(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this template',
        });
      }
    }
    
    await documentTemplateRepo.remove(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('[documentTemplateController.deleteTemplateHandler] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Templates
// ─────────────────────────────────────────────────────────────────────────────

async function getPublicTemplates(req, res) {
  try {
    const { type } = req.query;
    let templates = await documentTemplateRepo.listPublic();
    
    if (type) {
      const normalizedType = documentTemplateRepo.normalizeType(type);
      templates = templates.filter(t => t.type === normalizedType);
    }

    const userId = getCurrentUserId();
    const starredIds = userId ? await templateService.getUserStarredIds(userId) : [];
    const items = templates.map(mapDocumentRow);
    const payload = templateListResponse(items, { starredIds });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[documentTemplateController.getPublicTemplates] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list public templates',
      error: error.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Starred Templates
// ─────────────────────────────────────────────────────────────────────────────

async function getStarredTemplates(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  try {
    const starred = await templateService.getStarredTemplates(userId);
    const starredIds = await templateService.getUserStarredIds(userId);
    const items = starred.map(mapDocumentRow);
    const payload = templateListResponse(items, { starredIds });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[documentTemplateController.getStarredTemplates] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get starred templates',
      error: error.message,
    });
  }
}

async function starTemplate(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  try {
    const starred = await templateService.starTemplate(userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Template starred',
      data: { starredIds: starred },
    });
  } catch (error) {
    console.error('[documentTemplateController.starTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to star template',
      error: error.message,
    });
  }
}

async function unstarTemplate(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  try {
    const starred = await templateService.unstarTemplate(userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Template unstarred',
      data: { starredIds: starred },
    });
  } catch (error) {
    console.error('[documentTemplateController.unstarTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to unstar template',
      error: error.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Approval Workflow
// ─────────────────────────────────────────────────────────────────────────────

async function submitReviewHandler(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.submitForApproval(id, userId);
    return res.status(200).json({
      success: true,
      message: 'Template submitted for review',
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.submitReviewHandler] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit template for review',
      error: error.message,
    });
  }
}

async function listPendingTemplates(req, res) {
  // Admin only - middleware handles admin check
  try {
    const templates = await documentTemplateRepo.listPendingApproval();
    return res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('[documentTemplateController.listPendingTemplates] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list pending templates',
      error: error.message,
    });
  }
}

async function approveTemplate(req, res) {
  // Admin only - middleware handles admin check
  const adminUserId = getCurrentUserId();
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.approve(id, adminUserId);
    return res.status(200).json({
      success: true,
      message: 'Template approved',
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.approveTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve template',
      error: error.message,
    });
  }
}

async function rejectTemplate(req, res) {
  // Admin only - middleware handles admin check
  const adminUserId = getCurrentUserId();
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    const template = await documentTemplateRepo.reject(id, adminUserId, reason);
    return res.status(200).json({
      success: true,
      message: 'Template rejected',
      data: template,
    });
  } catch (error) {
    console.error('[documentTemplateController.rejectTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject template',
      error: error.message,
    });
  }
}

const previewDataRepo = require('../repositories/previewDataRepository');
const { mergePreviewData } = require('../utils/previewMerger');

async function getMergedPreviewData(userId) {
  const defaultData = await previewDataRepo.getPreviewData();
  if (!userId) return defaultData;
  try {
    const { getProfile } = require('../repositories/profileRepository');
    const userProfile = await getProfile(userId);
    return mergePreviewData(defaultData, userProfile);
  } catch (error) {
    console.error('[getMergedPreviewData] Error loading user profile:', error.message);
    return defaultData;
  }
}

async function getTemplatePreview(req, res) {
  const userId = getCurrentUserId();
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.getById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Check visibility
    const isOwner = userId && String(template.userId) === String(userId);
    const isVisible = template.isAdminTemplate || 
                      (template.isPublic && template.status === 'approved') ||
                      isOwner;
    
    if (!isVisible) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to preview this template',
      });
    }
    
    const sampleData = await getMergedPreviewData(userId);
    const html = renderTemplate(template, sampleData);
    
    return res.status(200).json({
      success: true,
      data: {
        html,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
        },
      },
    });
  } catch (error) {
    console.error('[documentTemplateController.getTemplatePreview] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: error.message,
    });
  }
}

/**
 * Returns raw HTML for template preview (for iframe embedding)
 */
async function getTemplatePreviewHtml(req, res) {
  const userId = getCurrentUserId();
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.getById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Check visibility
    const isOwner = userId && String(template.userId) === String(userId);
    const isVisible = template.isAdminTemplate || 
                      (template.isPublic && template.status === 'approved') ||
                      isOwner;
    
    if (!isVisible) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to preview this template',
      });
    }
    
    const sampleData = await getMergedPreviewData(userId);
    const html = renderTemplate(template, sampleData);
    
    // Return HTML directly for iframe embedding
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('[documentTemplateController.getTemplatePreviewHtml] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: error.message,
    });
  }
}

/**
 * Renders template HTML from raw layout/style payload without saving first.
 */
async function renderTemplatePreview(req, res) {
  const userId = getCurrentUserId();
  const template = req.body || {};
  
  try {
    const sampleData = await getMergedPreviewData(userId);
    const html = renderTemplate(template, sampleData);
    
    if (req.headers.accept?.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
    
    return res.status(200).json({
      success: true,
      data: { html }
    });
  } catch (error) {
    console.error('[documentTemplateController.renderTemplatePreview] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to render live preview',
      error: error.message,
    });
  }
}

module.exports = {
  // CRUD
  listTemplates,
  listUserTemplatesHandler,
  getTemplate,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  
  // Public
  getPublicTemplates,
  
  // Starred
  getStarredTemplates,
  starTemplate,
  unstarTemplate,
  
  // Approval
  submitReviewHandler,
  listPendingTemplates,
  approveTemplate,
  rejectTemplate,
  
  // Preview
  getTemplatePreview,
  getTemplatePreviewHtml,
  renderTemplatePreview,
};
