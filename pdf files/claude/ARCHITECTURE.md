# CV PDF Generation System - Complete Architecture

## 🏗️ System Overview

This is a **data-driven, modular CV generation system** designed for creating professional PDF documents from structured JavaScript data.

```
┌─────────────────────────────────────────────────────────────┐
│                    Your CV Content                          │
│                    (data.js)                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│             Rendering Engine                               │
│             (render.js)                                    │
│      - Reads data from data.js                             │
│      - Maps to HTML elements                               │
│      - Dynamically populates content                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│             HTML Template                                  │
│             (index.html)                                   │
│      - Semantic structure                                  │
│      - CSS classes for styling                             │
│      - Container divs for content                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│             Styling System                                 │
│             (styles.css)                                   │
│      - A4 page sizing                                      │
│      - Print optimization                                  │
│      - Reusable component styles                           │
│      - CSS variables for customization                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
     ┌──────▼─────┐      ┌───────▼──────┐
     │  Browser   │      │  Puppeteer   │
     │  Preview   │      │  PDF Export  │
     │ (Manual)   │      │ (Automated)  │
     └────────────┘      └──────────────┘
            │                     │
            └──────────┬──────────┘
                       │
            ┌──────────▼──────────┐
            │  output.pdf (A4)    │
            │  Professional CV    │
            └─────────────────────┘
```

---

## 📁 File Manifest

### Core Files (Essential)

| File | Size | Purpose | Edit? |
|------|------|---------|-------|
| `index.html` | ~3KB | HTML template structure | ⚙️ Rarely |
| `styles.css` | ~8KB | Print-optimized CSS | ✏️ Frequently |
| `data.js` | ~4KB | CV content (single source of truth) | ✏️ Always |
| `render.js` | ~6KB | Rendering engine (populates HTML from data) | ❌ Never |

### Execution Files

| File | Purpose | Run? |
|------|---------|------|
| `puppeteer-render.js` | Puppeteer PDF generation script | ✓ `npm run generate` |
| `package.json` | Node.js dependencies & scripts | Configure once |

### Documentation Files

| File | Purpose | Read? |
|------|---------|-------|
| `README.md` | Complete documentation | 📖 Reference |
| `QUICKSTART.md` | 5-minute setup guide | 📖 Start here |
| `ADDING_SECTIONS.md` | How to extend with new sections | 📖 When extending |
| `ARCHITECTURE.md` | This file - system overview | 📖 Understanding |

### Configuration Files

| File | Purpose |
|------|---------|
| `.gitignore` | Version control exclusions |

---

## 🔄 Data Flow

### 1. Data Definition
```javascript
// data.js
const cvData = {
    header: { name, contact, ... },
    workHistory: [ { job1 }, { job2 }, ... ],
    education: [ { degree1 }, { degree2 }, ... ],
    // ... more sections
};
```

### 2. Template Structure
```html
<!-- index.html -->
<div class="cv-container">
    <section id="workHistoryContainer">
        <!-- Empty - filled by renderer -->
    </section>
</div>
```

### 3. Rendering Logic
```javascript
// render.js
class CVRenderer {
    render() {
        this.renderWorkHistory(); // Maps data to HTML
        this.renderEducation();   // Maps data to HTML
        // ... etc
    }
}
```

### 4. Style Application
```css
/* styles.css */
.job-entry { /* Styles job entries */ }
.education-entry { /* Styles education entries */ }
```

### 5. Output
- **Browser**: Manual preview (file:// protocol)
- **PDF**: Automated via Puppeteer

---

## 🎨 Component System

Each section follows a **consistent component pattern**:

### Job Entry Component Example

**Data Structure** (data.js):
```javascript
{
    jobTitle: 'Senior Developer',
    company: 'Tech Corp',
    dateRange: 'Jan 2020 - Present',
    location: 'New York',
    responsibilities: ['Responsibility 1', 'Responsibility 2']
}
```

**HTML Template** (index.html):
```html
<div id="workHistoryContainer">
    <!-- Populated by renderer -->
</div>
```

**Rendering** (render.js):
```javascript
renderWorkHistory() {
    // Maps job data to HTML structure
    // Creates <div class="job-entry">...</div>
}
```

**Styling** (styles.css):
```css
.job-entry { /* Styles */ }
.job-title { /* Styles */ }
.job-company { /* Styles */ }
.responsibility-item { /* Styles */ }
```

### Pattern Applies To:
- Job entries
- Education entries
- Certifications
- Research publications
- Skill categories
- Competency badges

---

## 🔧 Customization Points

### By Editing `styles.css`
- ✏️ Colors
- ✏️ Fonts
- ✏️ Spacing
- ✏️ Margins
- ✏️ Page layout
- ✏️ Component styling

### By Editing `data.js`
- ✏️ All content
- ✏️ Add/remove jobs
- ✏️ Update contact info
- ✏️ Modify sections
- ✏️ Change text

### By Editing `index.html` + `render.js`
- ⚙️ Add new section types
- ⚙️ Change section order
- ⚙️ Modify HTML structure

### Never Edit
- ❌ `render.js` (unless adding new sections)
- ❌ `puppeteer-render.js` (usually)

---

## 🚀 Workflow

### Local Development

```bash
# 1. Edit data.js
vim data.js

# 2. Refresh browser to preview
# (open index.html in browser, hit F5)

# 3. Adjust styles if needed
vim styles.css

# 4. Refresh browser to see changes

# 5. Repeat until happy
```

### PDF Generation

```bash
# 1. Ensure all changes saved
# 2. Run Puppeteer
npm run generate

# 3. Check output.pdf
# 4. Adjust if needed, regenerate

# 5. Share output.pdf
```

---

## 📐 Technical Specifications

### Page Format
- **Size**: A4 (210mm × 297mm)
- **Margins**: 15mm (configurable)
- **Content Area**: ~180mm × 267mm

### Typography
- **Body Font**: Segoe UI, sans-serif (10.5pt)
- **Heading Font**: Segoe UI, sans-serif (bold)
- **Line Height**: 1.4 (body), 1.2 (tight)
- **Scale**: 9pt - 24pt

### Color Palette
- **Primary**: #1a1a1a (dark text)
- **Secondary**: #4a4a4a (meta text)
- **Accent**: #2c3e50 (section titles)
- **Background**: #ffffff (white)

### CSS Variables System
All design decisions via CSS variables:
```css
:root {
    --page-width: 210mm;
    --margin-*: 15mm;
    --font-family-*: ...;
    --font-size-*: ...;
    --color-*: ...;
    --spacing-*: ...;
}
```

---

## 🛠️ Extension Points

### Add New Section Type

```
1. Define in data.js
   newSection: [ { ... } ]

2. Add HTML container in index.html
   <div id="newSectionContainer"></div>

3. Add render method in render.js
   renderNewSection() { ... }

4. Call in init() method
   this.renderNewSection();

5. Style in styles.css
   .new-section-item { ... }
```

See `ADDING_SECTIONS.md` for detailed examples.

### Modify Component Style

Edit `styles.css`:
```css
.component-name {
    /* Modify existing styles */
    font-size: 11pt;
    color: #333333;
    /* Add new styles */
    letter-spacing: 0.5pt;
}
```

### Change Color Scheme

Edit `styles.css`:
```css
:root {
    --color-accent: #1a73e8;        /* New accent */
    --color-text-primary: #202124;  /* New primary */
}
```

---

## 🐛 Debugging

### Browser Console
```javascript
// Verify data loaded
console.log(cvData);

// Check rendering
console.log(document.getElementById('workHistoryContainer'));
```

### Visual Inspection
1. Open browser DevTools (F12)
2. Inspect elements
3. Check computed styles
4. Verify data in HTML

### PDF Generation Issues
1. Check puppeteer-render.js output
2. Verify HTML loads correctly
3. Test with minimal data
4. Check Puppeteer version

---

## 📦 Dependencies

### Required
- **Node.js**: v14+ (for Puppeteer)
- **Puppeteer**: v21+ (for PDF generation)

### Optional
- **Git**: Version control
- **Code Editor**: VS Code, Sublime, etc.

---

## 🔐 Security Considerations

### XSS Protection
All user content is escaped using `escapeHtml()`:
```javascript
// Safe from XSS
text.replace(/[&<>"']/g, m => ({ '&': '&amp;', ... }[m]));
```

### Data Validation
Optional validation in data.js:
```javascript
function validateCVData(data) {
    // Checks required fields exist
    // Runs on page load
}
```

---

## 📊 Performance

### Browser Rendering
- Minimal JavaScript
- Efficient DOM manipulation
- CSS-only styling
- ~50ms render time

### PDF Generation
- Puppeteer: ~2-3 seconds (first run)
- Chrome download: ~170MB (one time)
- File size: ~50-100KB

---

## 🎓 Learning Path

### For Users
1. Read `QUICKSTART.md` (5 min)
2. Edit `data.js` (2 min)
3. View in browser (1 min)
4. Generate PDF (2 min)

### For Customizers
1. Read `README.md` styling section
2. Edit `styles.css` CSS variables
3. Test in browser
4. Regenerate PDF

### For Developers
1. Read `ARCHITECTURE.md` (this file)
2. Read `ADDING_SECTIONS.md`
3. Add new section following pattern
4. Test thoroughly

---

## 💾 Version Control

### Track (in Git)
- `data.js` - CV content changes
- `styles.css` - Design changes
- `.gitignore` - Exclude generated files

### Don't Track
- `node_modules/` - Too large
- `output.pdf` - Generated file
- Temporary files

### Setup
```bash
git init
git add data.js styles.css index.html render.js .gitignore
git commit -m "Initial CV setup"
```

---

## 🚀 Deployment Ideas

### Static Website
```bash
# Upload to GitHub Pages
# Make HTML browsable at https://user.github.io/cv
```

### API Integration
```bash
# GET /api/cv → returns JSON data
# POST /api/cv → updates data
# GET /api/cv.pdf → generates PDF on-demand
```

### Headless CMS
```bash
# Connect data.js to headless CMS
# Generate CVs from centralized content
```

---

## 📝 Summary

**This system is:**
- ✅ Data-driven (single source of truth)
- ✅ Modular (easy to extend)
- ✅ Reusable (use for multiple CVs)
- ✅ Professional (A4 print-optimized)
- ✅ Simple (straightforward architecture)
- ✅ Maintainable (clean code structure)

**Use it for:**
- Professional CVs
- Resumes
- Cover letters
- Documents
- Reports

**Extend it for:**
- Multi-language CVs
- Portfolio sites
- ATS-friendly formats
- Custom designs

---

## 📞 Questions?

Refer to:
- `README.md` - Full documentation
- `QUICKSTART.md` - Getting started
- `ADDING_SECTIONS.md` - Adding sections
- Browser DevTools - Debugging
- Puppeteer docs - PDF options

---

Made with 🎨 for professional CV generation.
