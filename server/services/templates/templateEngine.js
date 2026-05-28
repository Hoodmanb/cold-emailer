/**
 * Document Template Engine
 * Merges AI output with template structure. Falls back to raw AI output when no template.
 */

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sectionExists(content, sectionName) {
  const pattern = new RegExp(`(^|\\n)\\s*#*\\s*${escapeRegExp(sectionName)}\\s*:?\\s*(\\n|$)`, 'i');
  return pattern.test(content);
}

function extractSectionBlocks(content) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let current = { heading: null, lines: [] };

  for (const line of lines) {
    const headingMatch = line.match(/^\s*#{1,3}\s*(.+?)\s*$/) || line.match(/^\s*([A-Z][A-Za-z0-9 &/-]{2,})\s*:?\s*$/);
    if (headingMatch) {
      if (current.heading || current.lines.length) blocks.push(current);
      current = { heading: headingMatch[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.heading || current.lines.length) blocks.push(current);
  return blocks;
}

function findBlockForSection(blocks, sectionName) {
  const target = sectionName.toLowerCase();
  return blocks.find((b) => {
    if (!b.heading) return false;
    const h = b.heading.toLowerCase();
    return h === target || h.includes(target) || target.includes(h);
  });
}

function applyStyleRules(content, style = {}) {
  let result = content;
  const rules = [];

  if (style.tone) rules.push(`Tone: ${style.tone}`);
  if (style.bulletStyle) rules.push(`Bullets: ${style.bulletStyle}`);
  if (style.atsOptimized) rules.push('ATS-optimized formatting applied');
  if (style.maxPages) rules.push(`Target length: ~${style.maxPages} page(s)`);

  if (rules.length && !result.includes('<!-- template-style -->')) {
    // Style metadata is informational only — content already shaped by AI prompt
  }

  return result.trim();
}

/**
 * Apply template structure to AI-generated plain text content.
 * @param {string} aiOutput - Raw AI output
 * @param {object|null} template - Document template definition
 * @returns {string} Formatted content
 */
function applyTemplate(aiOutput, template) {
  if (!template || !String(aiOutput || '').trim()) {
    return aiOutput;
  }

  try {
    const structure = Array.isArray(template.structure) ? template.structure : [];
    if (!structure.length) {
      return applyStyleRules(aiOutput, template.style);
    }

    const blocks = extractSectionBlocks(aiOutput);
    const used = new Set();
    const orderedSections = [];

    for (const section of structure) {
      const block = findBlockForSection(blocks, section);
      if (block) {
        used.add(block);
        const body = block.lines.join('\n').trim();
        orderedSections.push(body ? `## ${section}\n\n${body}` : `## ${section}`);
      } else if (sectionExists(aiOutput, section)) {
        orderedSections.push(`## ${section}`);
      } else {
        orderedSections.push(`## ${section}\n\n`);
      }
    }

    const leftover = blocks
      .filter((b) => !used.has(b))
      .map((b) => {
        if (b.heading) return `## ${b.heading}\n\n${b.lines.join('\n').trim()}`;
        return b.lines.join('\n').trim();
      })
      .filter(Boolean);

    const merged = [...orderedSections, ...leftover].filter(Boolean).join('\n\n').trim();
    return applyStyleRules(merged || aiOutput, template.style);
  } catch (err) {
    console.warn('[templateEngine] Failed to apply template, using raw AI output:', err.message);
    return aiOutput;
  }
}

/**
 * Resolve template for a document type, with safe fallback.
 * @param {Function} getTemplateById
 * @param {string|null} templateId
 * @param {string} documentType - e.g. resume, professional-cv, cover-letter
 */
function resolveTemplateSafe(getTemplateById, templateId, documentType) {
  if (!templateId) return null;
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      console.warn(`[templateEngine] Template ${templateId} not found, falling back to default generation`);
      return null;
    }
    const typeMap = {
      resume: 'resume',
      cv: 'cv',
      'professional-cv': 'cv',
      'cover-letter': 'cover_letter',
      cover_letter: 'cover_letter',
      email: 'email',
    };
    const expected = typeMap[String(documentType || '').toLowerCase()];
    if (expected && template.type !== expected) {
      console.warn(`[templateEngine] Template type mismatch (${template.type} vs ${expected}), ignoring template`);
      return null;
    }
    return template;
  } catch (err) {
    console.warn('[templateEngine] Template resolution failed:', err.message);
    return null;
  }
}

module.exports = {
  applyTemplate,
  applyStyleRules,
  resolveTemplateSafe,
  extractSectionBlocks,
};
