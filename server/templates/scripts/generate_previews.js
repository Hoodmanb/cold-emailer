const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { getRegistry, renderPreviewHtml } = require('../../services/document/documentEngine');

async function generatePreviews() {
  console.log('Starting automated preview generation...');
  const registry = getRegistry();
  
  if (registry.length === 0) {
    console.log('No templates found in registry.');
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const meta of registry) {
      const dataPath = path.join(meta.dirPath, 'sample-data.json');
      if (!fs.existsSync(dataPath)) {
        console.warn(`[WARN] Skipping ${meta.id}: No sample-data.json found.`);
        continue;
      }

      console.log(`Generating preview for: ${meta.id} (${meta.theme}/${meta.documentType})`);
      
      const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      // Render HTML using document engine
      const html = renderPreviewHtml(meta.featureId, sampleData, meta.theme);

      const page = await browser.newPage();
      
      // Set viewport to A4 proportion (e.g., 210x297 mm -> ~794x1123 px at 96 DPI)
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      // Ensure preview directory exists
      const previewsDir = path.join(__dirname, '..', 'previews', meta.slug);
      if (!fs.existsSync(previewsDir)) {
        fs.mkdirSync(previewsDir, { recursive: true });
      }

      const outPath = path.join(previewsDir, 'preview.webp');
      await page.screenshot({ path: outPath, type: 'webp', quality: 80, fullPage: false, clip: { x: 0, y: 0, width: 794, height: 1123 } });
      
      await page.close();
      console.log(`[OK] Saved preview to ${outPath}`);
    }
  } catch (err) {
    console.error('Error during preview generation:', err);
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('Preview generation complete.');
}

generatePreviews();
