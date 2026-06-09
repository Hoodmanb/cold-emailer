# Quick Start Guide

Get your PDF CV generated in 5 minutes.

## Step 1: View Your CV in Browser (1 minute)

```bash
# Simply open the HTML file in your browser
open index.html
```

You should see a formatted CV with sample data immediately.

---

## Step 2: Update Your Information (2 minutes)

Open `data.js` and update your information:

```javascript
const cvData = {
    header: {
        name: 'YOUR NAME',
        title: 'Your Professional Title',
        contact: {
            phone: '+1-XXX-XXX-XXXX',
            email: 'your@email.com',
            location: 'City, State'
        }
    },
    // ... update other sections
};
```

**Sections to update:**
- ✏️ `header` - Your name and contact info
- ✏️ `summary` - Professional summary (2-3 sentences)
- ✏️ `workHistory` - Array of job entries
- ✏️ `education` - Array of degrees
- ✏️ `certifications` - Array of certs
- ✏️ `research` - Array of publications
- ✏️ `skills` - Array of skill categories
- ✏️ `competencies` - Array of core competencies
- ✏️ `references` - Reference statement

**Refresh your browser** to see changes instantly.

---

## Step 3: Generate PDF (2 minutes)

### Prerequisites
```bash
# Install Node.js from https://nodejs.org (if not already installed)
node --version  # Should show v14+
```

### Generate
```bash
# Install Puppeteer (one time)
npm install

# Generate PDF
npm run generate
```

Your PDF will be saved as **`output.pdf`** ✓

---

## That's It! 🎉

You now have a professional CV PDF.

### Next Steps

- **Customize design?** Edit `styles.css`
- **Adjust layout?** Edit `index.html` and `styles.css`
- **Add new sections?** See "Adding New Sections" in README.md
- **Share PDF?** Send `output.pdf` to employers
- **Version control?** Keep `data.js` in Git to track CV changes

---

## Troubleshooting

### "Cannot find puppeteer"
```bash
npm install puppeteer
```

### "index.html not found"
Make sure you're in the correct directory containing all files.

### "CV doesn't update"
Refresh your browser after editing `data.js`.

### "PDF looks different than browser"
This is normal. PDF rendering is more strict. Adjust CSS in `styles.css` if needed.

### "Margins are wrong"
Ensure these match in both files:
- `styles.css`: CSS variables `--margin-*`
- `puppeteer-render.js`: `margins` object

---

## Common Edits

### Change Colors
Edit `styles.css`:
```css
:root {
    --color-accent: #2c3e50;      /* Section titles */
    --color-text-primary: #1a1a1a; /* Main text */
}
```

### Change Fonts
Edit `styles.css`:
```css
:root {
    --font-family-heading: 'Georgia', serif;
    --font-family-body: 'Calibri', sans-serif;
}
```

### Change Page Margins
Edit `styles.css`:
```css
:root {
    --margin-top: 12mm;
    --margin-left: 12mm;
    /* ... etc ... */
}
```

And in `puppeteer-render.js`:
```javascript
margins: {
    top: '12mm',
    left: '12mm',
    /* ... etc ... */
}
```

---

## File Reference

| File | Purpose | Edit? |
|------|---------|-------|
| `data.js` | Your CV content | ✏️ YES |
| `index.html` | HTML structure | ❌ Only if adding sections |
| `styles.css` | Design & colors | ✏️ YES |
| `render.js` | Rendering logic | ❌ NO |
| `puppeteer-render.js` | PDF generation | ⚙️ Optional |
| `package.json` | Dependencies | ❌ NO |
| `README.md` | Full documentation | 📖 Reference only |

---

## Need Help?

1. **Read README.md** for detailed documentation
2. **Check troubleshooting section** in README.md
3. **Inspect browser console** for errors (F12)
4. **Verify data.js structure** matches expected format

---

Good luck! Your professional CV awaits. 🚀
