/**
 * Derives AI prompt section order (structure) from layout + blocks.
 * Single source of truth: layout defines order; blocks provide titles.
 */

function collectBlockIds(layout) {
  if (!layout || typeof layout !== 'object') return [];
  if (layout.type === 'two-column' && Array.isArray(layout.columns)) {
    return layout.columns.flatMap((col) => col.blocks || []);
  }
  return Array.isArray(layout.blocks) ? layout.blocks : [];
}

function deriveStructureFromLayout(layout, blocks = {}) {
  const ids = collectBlockIds(layout);
  return ids.map((id) => {
    const block = blocks[id];
    if (block && block.title) return String(block.title).trim();
    if (typeof id === 'string' && id.length) {
      return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ');
    }
    return String(id);
  }).filter(Boolean);
}

function enrichTemplateWithStructure(template) {
  if (!template || typeof template !== 'object') return template;
  const existing = Array.isArray(template.structure) ? template.structure : [];
  if (existing.length) return template;
  const derived = deriveStructureFromLayout(template.layout, template.blocks);
  if (!derived.length) return template;
  return { ...template, structure: derived };
}

module.exports = {
  collectBlockIds,
  deriveStructureFromLayout,
  enrichTemplateWithStructure,
};
