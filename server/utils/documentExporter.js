const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { marked } = require('marked');

let puppeteer;
try { puppeteer = require('puppeteer'); } catch { puppeteer = null; }

/**
 * Converts Markdown content to various formats.
 * Always returns a proper Node.js Buffer (never Uint8Array) for safe Express res.send().
 */
const exportToFormat = async (content, format) => {
  const safeContent = typeof content === 'string' ? content : String(content || '');

  switch ((format || 'txt').toLowerCase()) {
    case 'html':
      return Buffer.from(buildHtml(safeContent), 'utf-8');

    case 'docx':
      return generateDocx(safeContent);

    case 'pdf':
      return generatePdf(safeContent);

    case 'json':
      return Buffer.from(JSON.stringify({ content: safeContent, generatedAt: new Date() }, null, 2), 'utf-8');

    case 'txt':
    case 'text':
      return Buffer.from(safeContent.replace(/[#*`_~]/g, '').replace(/\n{3,}/g, '\n\n').trim(), 'utf-8');

    case 'markdown':
    case 'md':
    default:
      return Buffer.from(safeContent, 'utf-8');
  }
};

function buildHtml(markdown) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 48px; max-width: 860px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 1.8rem; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { font-size: 1.25rem; color: #2c3e50; margin-top: 32px; margin-bottom: 10px; }
    h3 { font-size: 1rem; margin-top: 20px; }
    ul, ol { padding-left: 24px; }
    li { margin-bottom: 6px; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 28px 0; }
    strong { font-weight: 700; }
    p { margin-bottom: 12px; }
    .footer { margin-top: 60px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  </style>
</head>
<body>
  ${marked(markdown)}
</body>
</html>`;
}

/**
 * Generates a PDF Buffer from markdown content using Puppeteer.
 * puppeteer v22+ returns Uint8Array from page.pdf() — we always wrap in Buffer.from().
 */
const generatePdf = async (markdown) => {
  if (!puppeteer) {
    throw new Error('PDF generation unavailable: puppeteer is not installed');
  }

  const html = buildHtml(markdown);
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfResult = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
    });

    // puppeteer ≥22 returns Uint8Array — convert to Buffer so Express res.send() works correctly
    return Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Generates a DOCX Buffer from markdown content.
 */
const generateDocx = async (markdown) => {
  const lines = markdown.split('\n');
  const children = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(new Paragraph({ text: line.substring(2), bullet: { level: 0 } }));
    } else if (line.trim() !== '') {
      children.push(new Paragraph({ children: [new TextRun({ text: line })] }));
    } else {
      children.push(new Paragraph({}));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
};

module.exports = { exportToFormat };
