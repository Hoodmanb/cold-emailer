/**
 * Resume Template Registry
 * 
 * Refactored to act as a wrapper around the dynamic template registry in documentEngine.js.
 */

const { getRegistry } = require('./documentEngine');

function listResumeTemplates() {
  const registry = getRegistry();
  return registry
    .filter(t => t.featureId === 'resume_generation')
    .map(t => ({
      id: t.id,
      theme: t.theme,
      label: t.name,
      description: t.description || '',
      isDefault: Boolean(t.isDefault)
    }));
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
  resolveResumeTemplateFile,
  pickRandomTemplateFile,
  getDefaultTemplate,
};
