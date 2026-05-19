/**
 * Document Engine — Core Service
 *
 * Pipeline:
 *   (normalized model) → render HTML via Handlebars template (with CSS injected)
 *                      → convert to PDF (puppeteer) or DOCX (docx)
 *                      → persist to disk
 *                      → return { artifactId, downloadUrl, previewUrl, fileName, mime, sizeBytes }
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let Handlebars;
try {
  Handlebars = require('handlebars');
} catch {
  throw new Error('[documentEngine] handlebars is not installed. Run: npm install handlebars');
}

const { Document, Packer, Paragraph, TextRun } = require('docx');
let puppeteer;
try { puppeteer = require('puppeteer'); } catch { puppeteer = null; }

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACTS_DIR = path.join(SERVER_ROOT, 'storage', 'artifacts');
const TEMPLATES_DIR = path.join(SERVER_ROOT, 'templates');

const MIME = {
  html: 'text/html',
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// ── Dynamic Registry ────────────────────────────────────────────────────────
let TEMPLATE_REGISTRY = [];
let PARTIALS_LOADED = false;
let GLOBAL_CSS = '';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadGlobalCss() {
  if (GLOBAL_CSS) return GLOBAL_CSS;
  const stylesDir = path.join(TEMPLATES_DIR, 'styles');
  const vars = fs.existsSync(path.join(stylesDir, '_variables.css')) ? fs.readFileSync(path.join(stylesDir, '_variables.css'), 'utf8') : '';
  const typo = fs.existsSync(path.join(stylesDir, '_typography.css')) ? fs.readFileSync(path.join(stylesDir, '_typography.css'), 'utf8') : '';
  const print = fs.existsSync(path.join(stylesDir, '_print.css')) ? fs.readFileSync(path.join(stylesDir, '_print.css'), 'utf8') : '';
  GLOBAL_CSS = [vars, typo, print].join('\n\n');
  return GLOBAL_CSS;
}

function scanPartials(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanPartials(fullPath, baseDir);
    } else if (file.endsWith('.hbs')) {
      const relativePath = path.relative(baseDir, fullPath);
      const partialName = relativePath.replace(/\\/g, '/').replace(/\.hbs$/, '');
      const content = fs.readFileSync(fullPath, 'utf8');
      Handlebars.registerPartial(partialName, content);
    }
  }
}

function buildTemplateRegistry() {
  TEMPLATE_REGISTRY = [];
  const themes = fs.readdirSync(TEMPLATES_DIR);
  for (const theme of themes) {
    const themePath = path.join(TEMPLATES_DIR, theme);
    if (!fs.statSync(themePath).isDirectory()) continue;
    if (['partials', 'styles', 'scripts', 'assets'].includes(theme)) continue;

    const docTypes = fs.readdirSync(themePath);
    for (const docType of docTypes) {
      const docTypePath = path.join(themePath, docType);
      if (!fs.statSync(docTypePath).isDirectory()) continue;

      const metaPath = path.join(docTypePath, 'meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          meta.dirPath = docTypePath;
          meta.theme = theme;
          meta.documentType = docType;
          TEMPLATE_REGISTRY.push(meta);
        } catch (err) {
          console.error(`Failed to parse meta.json at ${metaPath}`, err);
        }
      }
    }
  }
}

function initializeEngine() {
  if (!PARTIALS_LOADED) {
    const partialsDir = path.join(TEMPLATES_DIR, 'partials');
    scanPartials(partialsDir);
    PARTIALS_LOADED = true;
  }
  buildTemplateRegistry();
  loadGlobalCss();
}

// ── Handlebars Helpers ────────────────────────────────────────────────────────
Handlebars.registerHelper('scoreClass', function(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
});

Handlebars.registerHelper('concat', function() {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  return args.join('');
});

// ── Template Resolution ───────────────────────────────────────────────────────
const templateCache = new Map();

function getTemplateMeta(featureId, themeId) {
  if (TEMPLATE_REGISTRY.length === 0) initializeEngine();

  // Filter templates that support this featureId
  const candidates = TEMPLATE_REGISTRY.filter(t => t.featureId === featureId);
  if (candidates.length === 0) {
    throw new Error(`No template found for featureId: "${featureId}"`);
  }

  if (themeId && themeId !== 'random') {
    const exact = candidates.find(t => t.theme === themeId || t.id === themeId);
    if (exact) return exact;
  }

  if (themeId === 'random') {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Default to the first candidate
  return candidates.find(t => t.isDefault) || candidates[0];
}

function loadTemplate(meta) {
  const cacheKey = `${meta.id}::${meta.theme}`;
  if (templateCache.has(cacheKey)) return templateCache.get(cacheKey);

  const templatePath = path.join(meta.dirPath, 'template.hbs');
  const source = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(source);

  // Load template specific CSS
  const cssPath = path.join(meta.dirPath, 'styles.css');
  const templateCss = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  const result = { compiled, templateCss };
  templateCache.set(cacheKey, result);
  return result;
}

// ── HTML Rendering ────────────────────────────────────────────────────────────
function renderHtml(featureId, model, options = {}) {
  const meta = getTemplateMeta(featureId, options.themeId);
  const { compiled, templateCss } = loadTemplate(meta);

  // Inject specific variables
  const enriched = { 
    ...model,
    globalCss: GLOBAL_CSS,
    templateCss: templateCss
  };

  if (featureId === 'ats_analysis') {
    enriched.scoreClass = model.score >= 75 ? 'high' : model.score >= 50 ? 'mid' : 'low';
  }

  return compiled(enriched);
}

// ── PDF generation (puppeteer) ────────────────────────────────────────────────
async function htmlToPdf(html) {
  if (!puppeteer) {
    throw new Error('[documentEngine] puppeteer is not installed.');
  }
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }, // Handled by body padding
    });
  } finally {
    await browser.close();
  }
}

// ── DOCX generation from HTML (lightweight via docx library) ─────────────────
async function htmlToDocx(html) {
  const text = html
    .replace(/<\/?(h1|h2|h3|p|li|div|section|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = text.split('\n');
  const children = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({});
    return new Paragraph({ children: [new TextRun({ text: trimmed, size: 22 })] });
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
  });

  return Packer.toBuffer(doc);
}

// ── Artifact persistence ──────────────────────────────────────────────────────
function persistArtifact({ buffer, featureId, format, userId, templateName }) {
  const artifactsDir = path.join(ARTIFACTS_DIR, String(userId || 'anon'));
  ensureDir(artifactsDir);

  const id = uuidv4();
  const ext = format === 'pdf' ? '.pdf' : format === 'docx' ? '.docx' : '.html';
  const fileName = `${featureId}_${Date.now()}${ext}`;
  const filePath = path.join(artifactsDir, fileName);

  fs.writeFileSync(filePath, buffer);

  const relativePath = path.relative(SERVER_ROOT, filePath).replace(/\\/g, '/');

  return {
    id, featureId, templateName, format, fileName,
    filePath: relativePath,
    mime: MIME[format] || 'application/octet-stream',
    sizeBytes: buffer.length,
    userId: String(userId || ''),
    createdAt: new Date().toISOString(),
    downloadUrl: `/api/documents/artifacts/${id}/download`,
    previewUrl:  `/api/documents/artifacts/${id}/preview`,
  };
}

// ── Main API ──────────────────────────────────────────────────────────────────
async function generateDocument({ featureId, model, format = 'pdf', userId, themeId }) {
  const meta = getTemplateMeta(featureId, themeId);
  
  if (!meta.formats.includes(format)) {
    throw new Error(`Format "${format}" is not supported for ${meta.name}`);
  }

  const html = renderHtml(featureId, model, { themeId });

  let buffer;
  if (format === 'html') {
    buffer = Buffer.from(html, 'utf-8');
  } else if (format === 'pdf') {
    buffer = await htmlToPdf(html);
  } else if (format === 'docx') {
    buffer = await htmlToDocx(html);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }

  return persistArtifact({
    buffer, featureId, format, userId,
    templateName: meta.id,
  });
}

function renderPreviewHtml(featureId, model, themeId) {
  return renderHtml(featureId, model, { themeId });
}

function resolveArtifactPath(relativePath) {
  return path.join(SERVER_ROOT, relativePath);
}

function getRegistry() {
  if (TEMPLATE_REGISTRY.length === 0) initializeEngine();
  return TEMPLATE_REGISTRY;
}

module.exports = {
  generateDocument,
  renderPreviewHtml,
  resolveArtifactPath,
  MIME,
  getRegistry,
  initializeEngine
};
