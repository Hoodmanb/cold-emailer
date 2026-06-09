# Pamilerin CV PDF Generator

A **modular, data-driven PDF generation system** built with HTML, CSS, and Puppeteer. This project recreates the Pamilerin Fayose CV as a reusable, code-based template that generates pixel-perfect A4 PDFs.

---

## 📁 Folder Structure

```
pamilerin-cv-generator/
├── index.html              # Base HTML structure with semantic sections
├── styles.css              # Print-first CSS with CSS variables & reusable classes
├── data.js                 # All CV content lives here (single source of truth)
├── render.js               # DOM rendering engine (maps data → HTML)
├── render-puppeteer.js     # Puppeteer script to generate the PDF
├── README.md               # This file
└── output/                 # Generated PDFs land here
    └── Pamilerin_Fayose_CV.pdf
```

---

## ⚙️ How the System Works

### Architecture

The system follows a **separation of concerns** pattern:

| File | Responsibility |
|------|---------------|
| `data.js` | Holds all content. The **only file** you edit to change text. |
| `render.js` | Reads `cvData` and injects HTML into `index.html` via DOM manipulation. |
| `styles.css` | Defines all visual styling, optimized for print/Puppeteer output. |
| `render-puppeteer.js` | Launches a headless browser, loads the HTML, and exports a PDF. |

### Data Flow

```
data.js (cvData object)
    ↓
render.js (maps data to DOM)
    ↓
index.html (semantic containers)
    ↓
styles.css (print-first styling)
    ↓
Puppeteer (renders → PDF)
```

---

## 🚀 How to Run the Project

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Step 1: Install Dependencies

```bash
npm install puppeteer
```

### Step 2: Generate the PDF

```bash
node render-puppeteer.js
```

The PDF will be saved to:
```
output/Pamilerin_Fayose_CV.pdf
```

### Optional: Preview in Browser

You can open `index.html` directly in any browser to preview the layout before generating the PDF. The CSS includes screen-friendly styling with a grey background and shadow for easy preview.

---

## ✏️ How to Update Content

All content lives in **`data.js`**. Simply edit the values in the `cvData` object.

### Example: Change the Name

```js
header: {
  name: "Pamilerin Fayose",  // ← Change this
  contact: [ ... ]
}
```

### Example: Add a New Job

In the `work` section (type: `"experience"`), add a new object to the `items` array:

```js
{
  title: "New Company Name",
  subtitle: "Job Title",
  location: "City, Country",
  dateRange: "Jan 2026 – Present",
  responsibilities: [
    "Responsibility one.",
    "Responsibility two."
  ]
}
```

### Example: Add a New Certification

In the `certifications` section, add a string to the `items` array:

```js
items: [
  "Existing cert...",
  "New Certification Name – Issuer (2026)"  // ← Add here
]
```

---

## ➕ How to Add a New Section

Adding a new section is a **4-step process**:

### Step 1: Add a Container in `index.html`

```html
<section id="cv-awards" class="cv-section cv-section--awards"></section>
```

### Step 2: Define the Data in `data.js`

```js
{
  id: "awards",
  type: "awards",
  title: "Awards & Honors",
  items: [
    "Best Employee of the Year – Holiday Inn Express (2026)"
  ]
}
```

### Step 3: Add a Render Function in `render.js`

Inside the IIFE, add:

```js
function renderAwardsSection(section, container) {
  container.appendChild(renderSectionTitle(section.title));

  const ul = document.createElement("ul");
  ul.className = "cv-cert-list"; // Reuse existing list style
  section.items.forEach(item => {
    const li = document.createElement("li");
    li.className = "cv-cert-item";
    li.textContent = item;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}
```

### Step 4: Register in `renderSection()`

Add a new case in the switch statement:

```js
case "awards":
  renderAwardsSection(section, container);
  break;
```

That’s it. The new section will render automatically.

---

## 🖨️ Puppeteer Print Settings

The `render-puppeteer.js` script uses these key settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| `format` | `"A4"` | Standard A4 paper size |
| `printBackground` | `true` | Ensures background colors/images render |
| `preferCSSPageSize` | `true` | Respects CSS `@page` rules |
| `waitUntil` | `"networkidle0"` | Waits for all assets to load |

### Explicit Margins vs. CSS Margins

Margins are controlled via CSS (`styles.css`):

```css
.cv-page {
  padding: 18mm 22mm 18mm 22mm;
}

@media print {
  @page { size: A4; margin: 0; }
}
```

If you prefer Puppeteer to handle margins instead, uncomment the `margin` option in `render-puppeteer.js` and remove the padding from `.cv-page`.

---

## 🐛 Common Issues & Fixes

### 1. Content Overflow / Sections Cut Off

**Problem:** A section gets split across two pages awkwardly.

**Fix:** Ensure the section or item has `page-break-inside: avoid;`:

```css
.cv-item {
  page-break-inside: avoid;
}
```

If a single item is too long for one page, split it into multiple items or reduce font size.

### 2. Page Breaks in Wrong Places

**Problem:** A section starts at the very bottom of a page.

**Fix:** Add `page-break-before: always;` to force a new page:

```css
.cv-section--work {
  page-break-before: always;
}
```

Or add a utility class in the data:

```js
{
  id: "work",
  type: "experience",
  title: "Work History",
  className: "page-break-before",  // ← Add this
  items: [ ... ]
}
```

Then in `render.js`, apply it:

```js
if (section.className) {
  container.classList.add(section.className);
}
```

### 3. Fonts Not Rendering in PDF

**Problem:** PDF uses fallback fonts instead of custom fonts.

**Fix:** Use system/web-safe fonts only (e.g., Georgia, Arial, Times New Roman). Puppeteer does not load external font files by default unless explicitly configured. The template uses only system fonts.

### 4. Background Colors Missing in PDF

**Problem:** PDF appears black-and-white or missing backgrounds.

**Fix:** Ensure `printBackground: true` is set in `render-puppeteer.js` and `-webkit-print-color-adjust: exact` is in `styles.css`.

### 5. Puppeteer Launch Fails (Linux/Docker)

**Problem:** `Error: Failed to launch the browser process`.

**Fix:** The script already includes `--no-sandbox` flags. If running in Docker, ensure dependencies are installed:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium-browser \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libgtk-3-0
```

### 6. Spacing Looks Different in Browser vs. PDF

**Problem:** Browser preview and PDF don’t match.

**Fix:**
- Use **pt** (points) instead of **px** or **rem** for all measurements.
- Avoid `vh`, `vw`, `%` for font sizes or spacing.
- The template uses a strict `pt`-based spacing system for consistency.

### 7. Adding a Second Page

**Problem:** Content exceeds one A4 page.

**Fix:** The template naturally supports multi-page output. Puppeteer will automatically create additional pages. To control where page breaks occur, use:

```css
.page-break-before { page-break-before: always; }
.page-break-after  { page-break-after: always; }
```

---

## 🎨 Customization Guide

### Changing Colors

Edit CSS variables in `styles.css`:

```css
:root {
  --color-text: #1a1a1a;
  --color-accent: #2c3e50;
  --color-border: #333333;
}
```

### Changing Fonts

```css
:root {
  --font-primary: "Georgia", serif;
  --font-secondary: "Arial", sans-serif;
}
```

### Changing Spacing

```css
:root {
  --space-lg: 14pt;   /* Increase for more breathing room */
  --section-gap: 20pt;
}
```

### Adding a Photo

1. Add an `<img>` tag in `index.html` inside the header.
2. Style it in `styles.css`.
3. Add the image path to `data.js` and render it in `render.js`.

---

## 📄 License

This project is provided as a reusable template. Modify and distribute freely for personal or commercial use.

---

## 💡 Tips for Production Use

- **Keep `data.js` clean.** Use a JSON schema validator if managing many CVs.
- **Version control.** Track `data.js` changes with Git to maintain CV history.
- **Batch generation.** Loop over multiple `data.js` files to generate CVs for multiple people.
- **CI/CD integration.** Run `node render-puppeteer.js` in a GitHub Action to auto-generate PDFs on push.
