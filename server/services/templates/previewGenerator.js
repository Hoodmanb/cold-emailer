const { fillPlaceholders, extractPlaceholders } = require('../../utils/placeholderParser');

const SAMPLE_VALUES = {
  name: 'Jane Doe',
  experience: '5 years in software engineering',
  company: 'Acme Corp',
  role: 'Senior Engineer',
  location: 'London, UK',
  email: 'jane.doe@example.com',
  customField: 'Sample value',
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightPlaceholdersHtml(content) {
  return escapeHtml(content || '').replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    '<mark class="placeholder">{{$1}}</mark>',
  );
}

function splitIntoPages(content, maxChars = 1800) {
  const text = String(content || '').trim();
  if (!text) return [''];

  const paragraphs = text.split(/\n{2,}/);
  const pages = [];
  let current = '';

  for (const para of paragraphs) {
    const block = para.trim();
    if (!block) continue;
    if ((current + '\n\n' + block).length > maxChars && current) {
      pages.push(current.trim());
      current = block;
    } else {
      current = current ? `${current}\n\n${block}` : block;
    }
  }
  if (current) pages.push(current.trim());
  return pages.length ? pages : [''];
}

function renderPageHtml(pageContent, pageIndex, totalPages) {
  const filled = fillPlaceholders(pageContent, SAMPLE_VALUES);
  const highlighted = highlightPlaceholdersHtml(pageContent);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; margin: 32px; color: #1e293b; line-height: 1.6; }
  .page-label { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  .preview-filled { white-space: pre-wrap; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
  .preview-raw { white-space: pre-wrap; font-size: 13px; color: #475569; }
  mark.placeholder { background: #fef3c7; color: #92400e; padding: 0 4px; border-radius: 3px; }
  h2 { font-size: 14px; margin: 0 0 8px; color: #334155; }
</style></head><body>
  <div class="page-label">Preview page ${pageIndex + 1} of ${totalPages}</div>
  <h2>Rendered preview</h2>
  <div class="preview-filled">${escapeHtml(filled)}</div>
  <h2>Template with placeholders</h2>
  <div class="preview-raw">${highlighted}</div>
</body></html>`;
}

function generatePreviewPages(template = {}) {
  const content =
    template.content ||
    (Array.isArray(template.structure) ? template.structure.join('\n\n') : '') ||
    template.aiRules ||
    '';

  const pages = splitIntoPages(content);
  const previewPages = pages.map((page, index) => ({
    page: index + 1,
    html: renderPageHtml(page, index, pages.length),
    placeholders: extractPlaceholders(page),
  }));

  const result = { previewPages, version: (template.version || 0) + 1 };
  previewPages.forEach((p, i) => {
    result[`previewPage${i + 1}`] = p.html;
  });

  return result;
}

module.exports = {
  generatePreviewPages,
  splitIntoPages,
  fillPlaceholders: (content) => fillPlaceholders(content, SAMPLE_VALUES),
};
