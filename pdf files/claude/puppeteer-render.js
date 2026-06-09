/**
 * ================================================
 * PUPPETEER PDF GENERATION SCRIPT
 * ================================================
 * 
 * Usage:
 *   node puppeteer-render.js
 * 
 * Requirements:
 *   npm install puppeteer
 * 
 * Output:
 *   output.pdf (A4, print-optimized)
 * 
 * The script:
 * 1. Launches headless Chrome
 * 2. Loads index.html with your CV data
 * 3. Applies print styles and A4 formatting
 * 4. Exports to PDF with proper margins
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ============ CONFIGURATION ============
const config = {
    // Input HTML file
    inputFile: 'index.html',

    // Output PDF file
    outputFile: 'output.pdf',

    // PDF Page Format
    format: 'A4',

    // Margins (must match CSS variables)
    margins: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
    },

    // Print background colors (essential for styled PDFs)
    printBackground: true,

    // Scale factor (1 = 100%)
    scale: 1,

    // Display header/footer
    displayHeaderFooter: false,
    // headerTemplate: '<div></div>',
    // footerTemplate: '<div></div>',

    // Page ranges (optional, leave empty for all)
    // pageRanges: '1-2',

    // Preferred media type
    preferCSSPageSize: true
};

// ============ MAIN FUNCTION ============
async function generatePDF() {
    let browser;
    try {
        console.log('🚀 Launching Puppeteer...');

        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu'
            ]
        });

        console.log('✓ Browser launched');

        // Create new page
        const page = await browser.newPage();

        // Set viewport (important for proper rendering)
        await page.setViewport({
            width: 794,  // A4 width in pixels (210mm @ 96dpi)
            height: 1123 // A4 height in pixels (297mm @ 96dpi)
        });

        // Get absolute file path
        const filePath = path.resolve(config.inputFile);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileUrl = `file://${filePath}`;
        console.log(`📄 Loading: ${fileUrl}`);

        // Navigate to HTML file
        await page.goto(fileUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('✓ Page loaded');

        // Wait for rendering to complete
        await page.waitForFunction(() => {
            const cvContainer = document.getElementById('cvContent');
            return cvContainer && cvContainer.children.length > 0;
        }, {
            timeout: 10000
        });

        console.log('✓ Content rendered');

        // Optional: Wait a bit for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate PDF
        console.log('📑 Generating PDF...');

        const pdfOptions = {
            path: config.outputFile,
            format: config.format,
            margin: config.margins,
            printBackground: config.printBackground,
            scale: config.scale,
            preferCSSPageSize: config.preferCSSPageSize,
            displayHeaderFooter: config.displayHeaderFooter
        };

        // Add optional parameters
        if (config.pageRanges) {
            pdfOptions.pageRanges = config.pageRanges;
        }

        await page.pdf(pdfOptions);

        console.log('✓ PDF generated');

        // Verify output file exists
        const outputPath = path.resolve(config.outputFile);
        const stats = fs.statSync(outputPath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log(`\n✅ SUCCESS!`);
        console.log(`📁 Output: ${config.outputFile}`);
        console.log(`📊 Size: ${fileSizeKB} KB`);
        console.log(`📐 Format: ${config.format}`);
        console.log(`\n🎉 Your CV is ready to use!`);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Ensure puppeteer is installed: npm install puppeteer');
        console.error('2. Check that index.html exists in current directory');
        console.error('3. Verify data.js is valid JavaScript');
        console.error('4. Check for JavaScript errors in browser console');
        process.exit(1);

    } finally {
        if (browser) {
            await browser.close();
            console.log('\n✓ Browser closed');
        }
    }
}

// ============ ERROR HANDLING ============
// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});

// ============ EXECUTION ============
if (require.main === module) {
    generatePDF();
}

module.exports = { generatePDF, config };
