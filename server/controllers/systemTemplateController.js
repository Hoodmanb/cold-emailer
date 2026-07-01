// server/controllers/systemTemplateController.js
/**
 * System Template Controller
 * Returns system/AI templates with proper preview URLs
 */

const documentTemplateRepo = require('../repositories/documentTemplateRepository');
const { renderTemplate } = require('../utils/renderJsonTemplate');
const { getCurrentUserId } = require('../middleware/requestContext');
const templateFacade = require('../domains/templates/templateFacade');

/**
 * Get all system/AI templates (admin templates)
 */
async function getSystemTemplates(req, res) {
  try {
    const transformed = await templateFacade.listSystemTemplates();
    
    return res.status(200).json({
      success: true,
      message: 'System templates retrieved successfully',
      data: transformed,
    });
  } catch (error) {
    console.error('[systemTemplateController.getSystemTemplates] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system templates',
      error: error.message,
    });
  }
}

/**
 * Get a single system template by ID
 */
async function getSystemTemplate(req, res) {
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.getById(id);
    if (!template || !template.isAdminTemplate) {
      return res.status(404).json({
        success: false,
        message: 'System template not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: template.id,
        slug: template.id,
        name: template.name,
        category: template.type || 'resume',
        theme: template.style?.theme || 'default',
        preview: `/api/system-templates/${template.id}/preview`,
        description: template.description || '',
        version: template.version || 1,
        engine: 'json',
        tags: template.isPublic ? ['public', 'approved'] : [],
        supportedDocuments: [template.type || 'resume'],
        premium: template.featured || false,
        supports: {
          ats: true,
          multiPage: true,
          coverLetter: template.type === 'cover_letter',
        },
        layout: template.layout,
        blocks: template.blocks,
        style: template.style,
      },
    });
  } catch (error) {
    console.error('[systemTemplateController.getSystemTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system template',
      error: error.message,
    });
  }
}

/**
 * Preview a system template directly (returns HTML)
 * This is used by the frontend TemplatePreview component
 */
async function previewSystemTemplate(req, res) {
  const userId = getCurrentUserId();
  const { id } = req.params;
  
  try {
    const template = await documentTemplateRepo.getById(id);
    if (!template || !template.isAdminTemplate) {
      return res.status(404).json({
        success: false,
        message: 'System template not found',
      });
    }
    
    // System templates are always visible
    // Get sample data if requested, otherwise use default sample data
    const sampleData = req.query.sample === 'false' 
      ? {}
      : await getSampleProfileData(userId);
    
    const html = renderTemplate(template, sampleData);
    
    // Return HTML directly for iframe embedding
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('[systemTemplateController.previewSystemTemplate] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
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

async function getSampleProfileData(userId) {
  return getMergedPreviewData(userId);
}

module.exports = {
  getSystemTemplates,
  getSystemTemplate,
  previewSystemTemplate,
};
