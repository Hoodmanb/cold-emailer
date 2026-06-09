const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

const KNOWN_PLACEHOLDERS = new Set([
  'name',
  'experience',
  'company',
  'role',
  'location',
  'email',
  'customField',
]);

function extractPlaceholders(content) {
  if (!content || typeof content !== 'string') return [];
  const found = new Set();
  let match;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

function validatePlaceholders(content, allowed = KNOWN_PLACEHOLDERS) {
  const placeholders = extractPlaceholders(content);
  const unknown = placeholders.filter((p) => !allowed.has(p));
  return { valid: unknown.length === 0, placeholders, unknown };
}

function fillPlaceholders(content, values = {}) {
  if (!content || typeof content !== 'string') return '';
  return content.replace(PLACEHOLDER_REGEX, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key] ?? '');
    }
    return `{{${key}}}`;
  });
}

function detectTemplateKind({ content, aiRules, structure }) {
  const hasPlaceholders = extractPlaceholders(content || '').length > 0;
  const hasAiRules = Boolean(aiRules && String(aiRules).trim());
  const hasStructure = Array.isArray(structure) && structure.length > 0;

  if (hasPlaceholders && (hasAiRules || hasStructure)) return 'hybrid';
  if (hasPlaceholders) return 'placeholder';
  return 'ai';
}

module.exports = {
  PLACEHOLDER_REGEX,
  KNOWN_PLACEHOLDERS,
  extractPlaceholders,
  validatePlaceholders,
  fillPlaceholders,
  detectTemplateKind,
};
