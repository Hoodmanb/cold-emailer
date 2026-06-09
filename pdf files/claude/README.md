# Professional CV PDF Generation System

A production-grade, data-driven CV generation system built with HTML, CSS, and Puppeteer. This system transforms a structured JavaScript data object into a pixel-perfect, print-optimized PDF.

## Table of Contents

1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Quick Start](#quick-start)
4. [How It Works](#how-it-works)
5. [Customization Guide](#customization-guide)
6. [Adding New Sections](#adding-new-sections)
7. [Puppeteer PDF Generation](#puppeteer-pdf-generation)
8. [Styling & Design](#styling--design)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)

---

## System Overview

This system follows a **data-driven architecture**:

```
data.js (Data) → render.js (Logic) → index.html (Template) → styles.css (Design) → PDF Output
```

### Key Principles

- **Single Source of Truth**: All content lives in `data.js`
- **No Hardcoding**: The HTML template is empty; content is injected via JavaScript
- **Print-Optimized**: CSS is specifically tuned for A4 PDF generation
- **Reusable Components**: Each section type (job, education, etc.) uses a consistent pattern
- **Modular Design**: Add, remove, or modify sections easily

---

## Project Structure

```
.
├── index.html          # Main HTML structure (template)
├── styles.css          # Print-optimized CSS (A4 sized)
├── data.js             # Your CV content (EDIT THIS)
├── render.js           # Rendering engine (reads from data.js)
├── puppeteer-render.js # Puppeteer script for PDF generation
├── package.json        # Node.js dependencies
└── README.md          # This file
```

### File Purposes

| File | Purpose | When to Edit |
|------|---------|--------------|
| `data.js` | CV content | Every time you update your CV |
| `render.js` | Rendering logic | Never (unless adding new section types) |
| `index.html` | HTML template | Only to add new sections |
| `styles.css` | Visual styling | To customize colors, fonts, spacing |
| `puppeteer-render.js` | PDF generation | Configure export settings |

---

## Quick Start

### 1. View the CV in Browser

```bash
# Simply open index.html in your browser
open index.html
# or
start index.html  # Windows
```

The CV will render automatically using content from `data.js`.

### 2. Update Your Content

Edit `data.js` with your information:

```javascript
const cvData = {
    header: {
        name: 'YOUR NAME HERE',
        contact: {
            phone: '...',
            email: '...',
            location: '...'
        }
    },
    // ... rest of your data
};
```

Refresh the browser to see changes immediately.

### 3. Generate PDF with Puppeteer

```bash
# Install dependencies
npm install puppeteer

# Generate PDF
node puppeteer-render.js
```

PDF will be saved as `output.pdf` in the current directory.

---

## How It Works

### Data Flow (Detailed)

1. **Data Definition** (`data.js`)
   - Define your CV content as a JavaScript object
   - Organized by section (header, workHistory, education, etc.)
   - Can be extended with new sections

2. **Template Creation** (`index.html`)
   - Empty semantic HTML structure
   - Placeholder elements with `id` and `class` attributes
   - No actual content in the HTML file

3. **Rendering** (`render.js`)
   - Reads `cvData` object
   - Maps data to HTML elements
   - Uses modern DOM manipulation
   - Renders dynamically on page load

4. **Styling** (`styles.css`)
   - Print-first CSS
   - A4 page sizing (210mm × 297mm)
   - CSS variables for easy customization
   - Optimized for Puppeteer output

5. **PDF Export** (`puppeteer-render.js`)
   - Launches headless Chrome
   - Loads the HTML file
   - Applies print styles
   - Exports to PDF with proper margins

### Example: Adding a Job Entry

**In `data.js`:**
```javascript
{
    jobTitle: 'Senior Developer',
    company: 'Tech Corp',
    dateRange: 'Jan 2020 - Present',
    location: 'New York, NY',
    responsibilities: [
        'Led development of...',
        'Improved performance by...'
    ]
}
```

**In `render.js`:**
```javascript
// Automatically creates this HTML:
<div class="job-entry">
    <div class="job-header">
        <div class="job-title">Senior Developer</div>
        <div class="job-company">Tech Corp</div>
    </div>
    <div class="job-meta">
        <span class="job-date-range">Jan 2020 - Present</span>
        <span class="job-location">New York, NY</span>
    </div>
    <div class="job-responsibilities">
        <div class="responsibility-item">• Led development of...</div>
        <div class="responsibility-item">• Improved performance by...</div>
    </div>
</div>
```

---

## Customization Guide

### Updating Content in `data.js`

All CV content is an object with these main sections:

#### Header Section
```javascript
header: {
    name: 'Your Full Name',
    title: 'Your professional summary',
    contact: {
        phone: '+1-234-567-8900',
        email: 'you@example.com',
        location: 'City, State'
    }
}
```

#### Work History
```javascript
workHistory: [
    {
        jobTitle: 'Job Title',
        company: 'Company Name',
        dateRange: 'Jan 2020 - Dec 2022',
        location: 'City, State',
        responsibilities: [
            'Responsibility 1',
            'Responsibility 2'
        ]
    }
]
```

#### Education
```javascript
education: [
    {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University Name',
        dateRange: 'Sep 2016 - May 2020'
    }
]
```

#### Other Sections
- `certifications`: Array of certification objects
- `research`: Array of research/publication objects
- `skills`: Array of skill category objects
- `competencies`: Simple string array
- `references`: Single string value
- `summary`: Professional summary text

### Modifying Styles in `styles.css`

#### Change Colors
```css
:root {
    --color-accent: #2c3e50;      /* Section titles, company names */
    --color-text-primary: #1a1a1a; /* Main text */
    --color-text-secondary: #4a4a4a; /* Meta information */
}
```

#### Change Fonts
```css
:root {
    --font-family-heading: 'Segoe UI', sans-serif;
    --font-family-body: 'Segoe UI', sans-serif;
}
```

**Recommended Professional Fonts:**
- `'Segoe UI'` (modern, clean)
- `'Calibri'` (readable, widely supported)
- `'Georgia'` (elegant serif)
- `'Arial'` (universal, safe)

#### Change Spacing
```css
:root {
    --spacing-sm: 6pt;
    --spacing-md: 10pt;
    --spacing-lg: 14pt;
    --spacing-section: 12pt;
}
```

#### Change Page Margins
```css
:root {
    --margin-top: 15mm;
    --margin-bottom: 15mm;
    --margin-left: 15mm;
    --margin-right: 15mm;
}
```

---

## Adding New Sections

### Step 1: Add HTML Template in `index.html`

```html
<section class="cv-section" data-section="newSection">
    <h2 class="section-title">NEW SECTION TITLE</h2>
    <div class="section-content" id="newSectionContainer">
        <!-- Content will be inserted here -->
    </div>
</section>
```

### Step 2: Add Data in `data.js`

```javascript
newSection: [
    {
        title: 'Entry Title',
        details: 'Entry details or description'
    }
]
```

### Step 3: Add Rendering Logic in `render.js`

```javascript
renderNewSection() {
    const container = document.getElementById('newSectionContainer');
    if (!container) return;

    container.innerHTML = this.data.newSection.map(item => `
        <div class="new-section-item">
            <div class="item-title">${this.escapeHtml(item.title)}</div>
            <div class="item-details">${this.escapeHtml(item.details)}</div>
        </div>
    `).join('');
}
```

### Step 4: Call the New Renderer in `init()`

```javascript
init() {
    // ... existing renders ...
    this.renderNewSection();  // Add this line
}
```

### Step 5: Add CSS Styles in `styles.css`

```css
.new-section-item {
    page-break-inside: avoid;
    margin-bottom: var(--spacing-md);
}

.item-title {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
}

.item-details {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
}
```

---

## Puppeteer PDF Generation

### Setup

```bash
npm install puppeteer
```

### Basic PDF Generation

Create `puppeteer-render.js`:

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Load the HTML file
    const filePath = path.join(__dirname, 'index.html');
    await page.goto(`file://${filePath}`, {
        waitUntil: 'networkidle2'
    });

    // Set print options
    await page.pdf({
        path: 'output.pdf',
        format: 'A4',
        margin: {
            top: '15mm',
            bottom: '15mm',
            left: '15mm',
            right: '15mm'
        },
        printBackground: true,
        scale: 1
    });

    await browser.close();
    console.log('PDF generated: output.pdf');
}

generatePDF().catch(console.error);
```

### Generate PDF

```bash
node puppeteer-render.js
```

### Output Options

**Custom filename:**
```javascript
await page.pdf({
    path: 'my-cv-2024.pdf',
    // ... other options
});
```

**Custom PDF dimensions:**
```javascript
await page.pdf({
    width: '210mm',
    height: '297mm',
    // ... other options
});
```

**Multiple page PDFs:**
The system automatically handles page breaks via CSS. Long CVs will naturally flow across multiple pages.

---

## Styling & Design

### Design Philosophy

This system uses a **refined, professional** aesthetic:

- Clean typography with clear hierarchy
- Accent color for section titles and companies
- Consistent spacing using CSS variables
- Print-first approach (no web-only features)
- Emphasis on readability and organization

### CSS Variable System

All design decisions are driven by CSS variables, making it easy to maintain a consistent design language:

```css
:root {
    /* Page dimensions */
    --page-width: 210mm;
    --page-height: 297mm;

    /* Spacing system */
    --spacing-xs: 3pt;
    --spacing-sm: 6pt;
    --spacing-md: 10pt;
    --spacing-lg: 14pt;
    --spacing-xl: 18pt;

    /* Typography scale */
    --font-size-base: 10.5pt;
    --font-size-small: 9.5pt;
    --font-size-section-title: 11pt;
    --font-size-name: 24pt;

    /* Color palette */
    --color-text-primary: #1a1a1a;
    --color-accent: #2c3e50;
    --color-light-border: #d0d0d0;
}
```

### Maintaining Consistency

When modifying styles:

1. **Always use CSS variables** instead of hardcoded values
2. **Keep spacing proportional** (use the spacing scale)
3. **Test with Puppeteer** to ensure PDF output matches
4. **Check page breaks** for long sections
5. **Verify on A4 dimensions** during browser viewing

### Responsive Sections

The system includes two-column layouts (skills) and three-column layouts (competencies) that are carefully tuned for A4 printing:

```css
/* Two-column layout for skills */
.skills-list {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
}

/* Three-column layout for competencies */
.competencies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
}
```

These automatically adjust content distribution for optimal A4 fit.

---

## Troubleshooting

### Issue: Content Overflows Page

**Problem:** Text extends beyond the A4 page margin in the PDF.

**Solutions:**
1. **Reduce margins in `styles.css`:**
   ```css
   :root {
       --margin-top: 12mm;
       --margin-bottom: 12mm;
   }
   ```

2. **Reduce font sizes:**
   ```css
   :root {
       --font-size-base: 10pt;
       --font-size-small: 9pt;
   }
   ```

3. **Remove sections:** Delete unused sections from `data.js`

4. **Compress spacing:**
   ```css
   :root {
       --spacing-md: 8pt;
       --spacing-section: 10pt;
   }
   ```

### Issue: Page Breaks in Wrong Places

**Problem:** Sections break awkwardly between pages.

**Solutions:**
1. **Add page-break-inside: avoid** to CSS:
   ```css
   .job-entry {
       page-break-inside: avoid;
   }
   ```

2. **Reduce spacing** before large sections to push them to next page

3. **Reorder sections** in `data.js` to balance page lengths

### Issue: PDF Margins Are Incorrect

**Problem:** Puppeteer PDF has different margins than expected.

**Solutions:**
1. **Ensure styles.css margins match puppeteer-render.js:**
   ```css
   /* styles.css */
   --margin-top: 15mm;
   ```
   ```javascript
   // puppeteer-render.js
   margin: {
       top: '15mm',
       bottom: '15mm',
       left: '15mm',
       right: '15mm'
   }
   ```

2. **Clear print styles cache:**
   - Delete old PDF
   - Refresh browser
   - Regenerate PDF

3. **Check Puppeteer headless mode:**
   ```javascript
   const browser = await puppeteer.launch({
       headless: 'new'  // Latest headless mode
   });
   ```

### Issue: Fonts Look Wrong in PDF

**Problem:** Fonts don't render correctly in PDF.

**Solutions:**
1. **Use system-safe fonts:**
   ```css
   --font-family-body: 'Segoe UI', 'Arial', sans-serif;
   ```

2. **Ensure Puppeteer uses correct fonts:**
   ```javascript
   const page = await browser.newPage();
   await page.setUserAgent('Mozilla/5.0'); // Ensure font compatibility
   ```

3. **Check for font fallbacks** in CSS

### Issue: Colors Don't Print

**Problem:** Background colors appear different in PDF.

**Solutions:**
1. **Ensure printBackground is true:**
   ```javascript
   await page.pdf({
       printBackground: true
   });
   ```

2. **Use CSS color-adjust:**
   ```css
   body {
       -webkit-print-color-adjust: exact;
       print-color-adjust: exact;
   }
   ```

### Issue: Renderer Not Working

**Problem:** CV content doesn't appear in HTML.

**Solutions:**
1. **Check browser console** for JavaScript errors
2. **Verify `data.js` is loaded** before `render.js`
3. **Check HTML file path** in browser
4. **Ensure HTML file structure matches** expected IDs

---

## Advanced Usage

### Multi-Format Export

Generate CV in multiple formats:

```javascript
async function generateMultipleFormats() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${filePath}`);

    // PDF
    await page.pdf({ path: 'cv.pdf' });

    // Capture screenshot
    await page.screenshot({ path: 'cv-preview.png' });

    await browser.close();
}
```

### Templating Multiple CVs

Use the same system to generate multiple CVs:

```javascript
const cvVariants = {
    'technical': { /* data */ },
    'management': { /* data */ },
    'startup': { /* data */ }
};

for (const [name, data] of Object.entries(cvVariants)) {
    // Override cvData with variant
    window.cvData = data;
    // Render and export
}
```

### Programmatic Data Generation

Load CV data from external source:

```javascript
// Instead of hardcoded data.js:
async function loadCVData() {
    const response = await fetch('/api/cv-data');
    window.cvData = await response.json();
    new CVRenderer(window.cvData);
}
```

### Batch PDF Generation

Generate PDFs for multiple candidates:

```javascript
const candidates = [
    { name: 'Alice', phone: '...', email: '...' },
    { name: 'Bob', phone: '...', email: '...' }
];

for (const candidate of candidates) {
    const cvData = { header: candidate, /* ... */ };
    // Generate PDF for each
}
```

### Automated Testing

Validate CV structure before generating PDF:

```javascript
const requiredSections = [
    'header', 'summary', 'workHistory', 'education'
];

for (const section of requiredSections) {
    if (!cvData[section]) {
        throw new Error(`Missing section: ${section}`);
    }
}
```

---

## Performance Tips

1. **Minimize CSS** before production (remove comments)
2. **Optimize font loading** (use system fonts)
3. **Cache Puppeteer browser** if generating many PDFs
4. **Use streaming** for large output files
5. **Profile page render time** with Chrome DevTools

---

## Browser Compatibility

This system works with:
- Chrome/Chromium (Puppeteer)
- Firefox (with minor adjustments)
- Safari (print CSS may need tweaks)
- Edge (same as Chrome)

For best results, use **Chrome** or **Chromium** with Puppeteer.

---

## License & Attribution

This system is provided as-is for professional use.

---

## Support & Questions

**Common Questions:**

Q: Can I modify the layout structure?
A: Yes! Edit `index.html` and add corresponding CSS in `styles.css`.

Q: How do I add a profile photo?
A: Add an `<img>` element in header section and reference via `data.js`.

Q: Can I use this for other document types?
A: Absolutely! The system is flexible for letters, resumes, proposals, etc.

Q: How do I share the CV?
A: Share the generated PDF or the entire directory (with instructions).

Q: Can I version control my CV?
A: Yes! Keep `data.js` in version control and regenerate PDFs as needed.

---

## Final Notes

This system is designed for **maximum flexibility and maintainability**. 

- Keep all content in `data.js`
- Don't modify HTML structure unless adding new sections
- Use CSS variables for all design changes
- Test with Puppeteer before finalizing
- Keep the system simple and modular

Happy CV building! 🎉
