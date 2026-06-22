/**
 * Resume Template Registry
 * 
 * Refactored to act as a wrapper around the dynamic template registry in documentEngine.js.
 */

const documentTemplateRepo = require('../../repositories/documentTemplateRepository');

function listResumeTemplates() {
  // Sync wrapper — callers expect immediate array; load from DB when available.
  return [];
}

async function listResumeTemplatesAsync() {
  try {
    const templates = await documentTemplateRepo.listPublic();
    return templates
      .filter((t) => t.type === 'cv' || t.type === 'resume')
      .map((t) => ({
        id: t.id,
        theme: t.id,
        label: t.name,
        description: t.description || '',
        isDefault: t.featured === true,
      }));
  } catch (_err) {
    return [];
  }
}

function getDefaultTemplate() {
  const templates = listResumeTemplates();
  return templates.find(t => t.isDefault) || templates[0];
}

function pickRandomTemplateFile() {
  const templates = listResumeTemplates();
  if (templates.length === 0) return null;
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx].id;
}

function resolveResumeTemplateFile(themeId) {
  const raw = String(themeId || '').trim().toLowerCase();
  if (raw === 'random') return pickRandomTemplateFile();
  if (!raw) return getDefaultTemplate()?.id;
  
  const templates = listResumeTemplates();
  const found = templates.find(t => t.id === raw || t.theme === raw);
  if (found) return found.id;
  
  return getDefaultTemplate()?.id;
}

module.exports = {
  listResumeTemplates,
  listResumeTemplatesAsync,
  resolveResumeTemplateFile,
  pickRandomTemplateFile,
  getDefaultTemplate,
};
