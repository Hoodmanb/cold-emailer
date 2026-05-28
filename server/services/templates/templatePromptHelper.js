/**
 * Builds AI prompt suffix from document template constraints.
 */

function formatStyleRules(style = {}) {
  const lines = [];
  if (style.tone) lines.push(`- Tone: ${style.tone}`);
  if (style.bulletStyle) lines.push(`- Bullet style: ${style.bulletStyle}`);
  if (style.atsOptimized) lines.push('- ATS optimized: use standard headings, no tables/columns/graphics');
  if (style.multiPage) lines.push('- Multi-page document allowed');
  if (style.maxPages) lines.push(`- Target length: approximately ${style.maxPages} page(s)`);
  if (style.length) lines.push(`- Length: ${style.length}`);
  if (style.paragraphs) lines.push(`- Use approximately ${style.paragraphs} paragraphs`);
  if (style.maxWords) lines.push(`- Maximum ${style.maxWords} words`);
  return lines;
}

function buildTemplatePromptSuffix(template) {
  if (!template) return '';

  const sections = Array.isArray(template.structure) ? template.structure : [];
  const styleLines = formatStyleRules(template.style || {});
  const parts = [];

  if (sections.length) {
    const numbered = sections.map((s, i) => `${i + 1}. ${s}`).join('\n');
    parts.push(`You MUST follow this document structure exactly (use these as section headings):\n${numbered}`);
  }

  if (styleLines.length) {
    parts.push(`Writing style:\n${styleLines.join('\n')}`);
  }

  if (template.aiRules) {
    parts.push(`Additional constraints:\n${template.aiRules}`);
  }

  if (!parts.length) return '';
  return `\n\n--- TEMPLATE CONSTRAINTS (${template.name || 'Custom Template'}) ---\n${parts.join('\n\n')}\n--- END TEMPLATE CONSTRAINTS ---`;
}

function mapDocumentTypeToTemplateType(documentType) {
  const t = String(documentType || '').toLowerCase();
  if (t === 'resume') return 'resume';
  if (t === 'professional-cv' || t === 'cv') return 'cv';
  if (t === 'cover-letter' || t === 'cover_letter') return 'cover_letter';
  if (t === 'email') return 'email';
  return null;
}

module.exports = {
  buildTemplatePromptSuffix,
  formatStyleRules,
  mapDocumentTypeToTemplateType,
};
