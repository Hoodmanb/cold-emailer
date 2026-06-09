/* ============================================================
   PUPPETEER PDF GENERATION SCRIPT

   Usage:
     node render-puppeteer.js

   Requires:
     npm install puppeteer
   ============================================================ */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

(async () => {
    const inputFile = path.resolve(__dirname, "index.html");
    const outputFile = path.resolve(__dirname, "output", "Pamilerin_Fayose_CV.pdf");

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu"
        ]
    });

    const page = await browser.newPage();

    // Load the HTML file
    const fileUrl = "file://" + inputFile;
    await page.goto(fileUrl, {
        waitUntil: "networkidle0",
        timeout: 30000
    });

    // Wait for fonts and layout to settle
    await page.waitForTimeout(500);

    // Generate PDF
    await page.pdf({
        path: outputFile,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        // If you prefer explicit margins over CSS @page:
        // margin: { top: "18mm", right: "22mm", bottom: "18mm", left: "22mm" }
    });

    await browser.close();

    console.log(`✅ PDF generated successfully: ${outputFile}`);
})();