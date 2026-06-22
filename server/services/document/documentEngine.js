/**
 * Document Engine — Core Service (Refactored to Block-based JSON)
 *
 * Pipeline:
 *   (normalized model) → render HTML via JSON template engine
 *                      → convert to PDF (puppeteer) or DOCX (docx)
 *                      → persist to disk
 *                      → return { artifactId, downloadUrl, previewUrl, fileName, mime, sizeBytes }
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const documentTemplateRepo = require('../../repositories/documentTemplateRepository');
const { renderTemplate } = require('../../utils/renderJsonTemplate');

const { Document, Packer, Paragraph, TextRun } = require('docx');
let puppeteer;
try { puppeteer = require('puppeteer'); } catch { puppeteer = null; }

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACTS_DIR = path.join(SERVER_ROOT, 'storage', 'artifacts');

const MIME = {
  html: 'text/html',
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const fallbackTemplate = {
  name: 'Default ATS Classic',
  layout: {
    type: 'single-column',
    blocks: ['profile', 'experience', 'education', 'skills', 'projects', 'certificates']
  },
  blocks: {
    profile: { type: 'profile', title: 'Profile Summary' },
    experience: { type: 'experience', title: 'Professional Experience' },
    education: { type: 'education', title: 'Education' },
    skills: { type: 'skills', title: 'Key Skills' },
    projects: { type: 'projects', title: 'Projects' },
    certificates: { type: 'certificates', title: 'Certifications' }
  },
  style: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    primaryColor: '#111111',
    fontSize: 12,
    spacing: 12
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Template Resolution ───────────────────────────────────────────────────────
async function getTemplateMeta(themeId) {
  if (themeId && themeId !== 'random') {
    try {
      const exact = await documentTemplateRepo.getById(themeId);
      if (exact) return exact;
    } catch (_err) {
      // ignore
    }
  }

  // Retrieve first public CV template as fallback
  try {
    const candidates = await documentTemplateRepo.listPublic();
    const cvTemplates = candidates.filter(t => t.type === 'cv');
    return cvTemplates[0] || candidates[0] || fallbackTemplate;
  } catch (_err) {
    return fallbackTemplate;
  }
}

function modelToPreviewData(model) {
  if (!model || typeof model !== 'object') return {};
  if (model.name || model.email) return model;

  const contact = model.contact && typeof model.contact === 'object' ? model.contact : {};
  return {
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    location: contact.location || '',
    summary: model.summary || '',
    linkedinUrl: contact.linkedin || contact.linkedinUrl || '',
    githubUrl: contact.website || model.githubUrl || '',
    experience: Array.isArray(model.experience)
      ? model.experience.map((exp) => ({
        role: exp.title || exp.role || '',
        title: exp.title || exp.role || '',
        company: exp.company || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || 'Present',
        description: Array.isArray(exp.bullets)
          ? exp.bullets.map((b) => `- ${b}`).join('\n')
          : (exp.description || ''),
      }))
      : [],
    education: Array.isArray(model.education)
      ? model.education.map((edu) => ({
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        institution: edu.institution || '',
        startDate: edu.startDate || edu.year || '',
        endDate: edu.endDate || edu.year || '',
      }))
      : [],
    skills: Array.isArray(model.skills)
      ? model.skills.map((s) => (typeof s === 'string' ? { name: s } : { name: s.name || s }))
      : [],
    certificates: Array.isArray(model.certifications)
      ? model.certifications.map((c) => (typeof c === 'string' ? { name: c } : c))
      : [],
    projects: Array.isArray(model.projects) ? model.projects : [],
  };
}

// ── HTML Rendering ────────────────────────────────────────────────────────────
async function renderHtml(model, options = {}) {
  const template = await getTemplateMeta(options.themeId);
  return renderTemplate(template, modelToPreviewData(model));
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
    const pdfResult = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
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

  const buffer = await Packer.toBuffer(doc);
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
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
  const template = await getTemplateMeta(themeId);
  const html = await renderHtml(model, { themeId });

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
    templateName: template.name || template.id || 'JSONTemplate',
  });
}

async function renderPreviewHtml(featureId, model, themeId) {
  return renderHtml(model, { themeId });
}

function resolveArtifactPath(relativePath) {
  return path.join(SERVER_ROOT, relativePath);
}

// Minimal placeholder registry methods for system compatibility
function getRegistry() {
  return [fallbackTemplate];
}

function initializeEngine() {
  // No-op in JSON engine
}

module.exports = {
  generateDocument,
  renderPreviewHtml,
  resolveArtifactPath,
  MIME,
  getRegistry,
  initializeEngine
};
