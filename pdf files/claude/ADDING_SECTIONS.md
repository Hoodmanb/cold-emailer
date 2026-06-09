# Example: Adding a New Section

This file demonstrates how to add a new section to your CV using the existing system.

## Example: Adding a "Languages" Section

Let's add a languages section to the CV that lists languages with proficiency levels.

---

## Step 1: Add HTML Template

Edit `index.html` and add this section (before the References section):

```html
<!-- Languages Section -->
<section class="cv-section" data-section="languages">
    <h2 class="section-title">LANGUAGES</h2>
    <div class="section-content" id="languagesContainer">
        <!-- Dynamically populated -->
    </div>
</section>
```

---

## Step 2: Add Data to data.js

In `data.js`, add the languages array to the `cvData` object:

```javascript
const cvData = {
    header: { /* ... */ },
    summary: { /* ... */ },
    workHistory: [ /* ... */ ],
    education: [ /* ... */ ],
    
    // ADD THIS:
    languages: [
        {
            language: 'English',
            proficiency: 'Native Speaker'
        },
        {
            language: 'Spanish',
            proficiency: 'Fluent'
        },
        {
            language: 'French',
            proficiency: 'Intermediate'
        }
    ],
    
    // ... rest of data
};
```

---

## Step 3: Add CSS Styles

Edit `styles.css` and add these new styles:

```css
/* ============ LANGUAGES COMPONENT ============ */
.language-entry {
    page-break-inside: avoid;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: var(--border-width) solid var(--color-light-border);
}

.language-entry:last-child {
    border-bottom: none;
}

.language-name {
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
}

.language-proficiency {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    font-style: italic;
}
```

---

## Step 4: Add Rendering Logic

Edit `render.js` and add this method to the `CVRenderer` class:

```javascript
/**
 * LANGUAGES RENDERING
 * Dynamically creates language entry components
 */
renderLanguages() {
    const container = document.getElementById('languagesContainer');
    if (!container) return;

    if (this.data.languages && this.data.languages.length > 0) {
        container.innerHTML = this.data.languages.map(lang => `
            <div class="language-entry">
                <div class="language-name">${this.escapeHtml(lang.language)}</div>
                <div class="language-proficiency">${this.escapeHtml(lang.proficiency)}</div>
            </div>
        `).join('');
    }
}
```

---

## Step 5: Call the Renderer

In `render.js`, find the `init()` method and add the call to render languages:

```javascript
init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.render());
    } else {
        this.render();
    }
}

render() {
    try {
        this.renderHeader();
        this.renderSummary();
        this.renderWorkHistory();
        this.renderEducation();
        this.renderCertifications();
        this.renderResearch();
        this.renderSkills();
        
        // ADD THIS LINE:
        this.renderLanguages();
        
        this.renderCompetencies();
        this.renderReferences();
        console.log('CV rendering complete');
    } catch (error) {
        console.error('Error rendering CV:', error);
    }
}
```

---

## Step 6: Test

1. **Refresh your browser** - the Languages section should appear
2. **Edit `data.js`** - add/remove languages
3. **Generate PDF** - run `npm run generate`

---

## Advanced Example: Adding a Portfolio Section

Here's another example with a more complex structure (portfolio projects):

### Data Structure
```javascript
portfolio: [
    {
        projectName: 'E-Commerce Platform',
        role: 'Lead Developer',
        technologies: ['React', 'Node.js', 'MongoDB'],
        description: 'Built full-stack e-commerce platform',
        url: 'https://example.com'
    },
    {
        projectName: 'Mobile App',
        role: 'Designer & Developer',
        technologies: ['React Native', 'Firebase'],
        description: 'Developed cross-platform mobile app',
        url: 'https://example.com'
    }
]
```

### HTML Template
```html
<section class="cv-section" data-section="portfolio">
    <h2 class="section-title">PORTFOLIO</h2>
    <div class="section-content" id="portfolioContainer">
        <!-- Dynamically populated -->
    </div>
</section>
```

### CSS
```css
.portfolio-entry {
    page-break-inside: avoid;
    margin-bottom: var(--spacing-lg);
}

.portfolio-name {
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--color-accent);
}

.portfolio-role {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
}

.portfolio-tech {
    display: flex;
    gap: var(--spacing-sm);
    margin: var(--spacing-sm) 0;
    flex-wrap: wrap;
}

.tech-tag {
    background: var(--color-accent);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-small);
    border-radius: 2pt;
}

.portfolio-description {
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
}
```

### JavaScript Renderer
```javascript
renderPortfolio() {
    const container = document.getElementById('portfolioContainer');
    if (!container) return;

    if (this.data.portfolio && this.data.portfolio.length > 0) {
        container.innerHTML = this.data.portfolio.map(project => `
            <div class="portfolio-entry">
                <div class="portfolio-name">${this.escapeHtml(project.projectName)}</div>
                <div class="portfolio-role">${this.escapeHtml(project.role)}</div>
                <div class="portfolio-tech">
                    ${project.technologies.map(tech => `
                        <span class="tech-tag">${this.escapeHtml(tech)}</span>
                    `).join('')}
                </div>
                <div class="portfolio-description">${this.escapeHtml(project.description)}</div>
            </div>
        `).join('');
    }
}
```

---

## Pattern Summary

Every new section follows this pattern:

1. **Data** → Define in `data.js` (array or object)
2. **Template** → Add container div in `index.html`
3. **Styles** → Create CSS classes in `styles.css`
4. **Renderer** → Add method to `CVRenderer` class in `render.js`
5. **Call** → Add `this.renderSection()` in `render()` method
6. **Test** → Refresh browser and generate PDF

---

## Best Practices

### ✓ DO
- Use consistent CSS variable names
- Add `page-break-inside: avoid` to entry components
- Use `this.escapeHtml()` for all text content
- Keep components modular and reusable
- Test with multiple content lengths
- Follow existing naming conventions

### ✗ DON'T
- Hardcode colors (use CSS variables)
- Forget to escape HTML (security risk)
- Make sections wider than available space
- Add sections without testing page breaks
- Modify existing component styles unexpectedly
- Use inline styles (keep everything in CSS)

---

## Styling Tips

### Alignment & Layout
```css
/* Side-by-side layout */
.entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

/* Avoid page breaks */
.entry {
    page-break-inside: avoid;
}

/* Consistent spacing */
margin-bottom: var(--spacing-md);
```

### Typography
```css
/* Use consistent font sizing */
font-size: var(--font-size-base);
font-size: var(--font-size-small);

/* Use semantic weights */
font-weight: 600;  /* Bold labels */
font-weight: normal; /* Regular text */
```

### Colors
```css
/* Consistent color usage */
color: var(--color-accent);  /* Important text */
color: var(--color-text-primary);   /* Main text */
color: var(--color-text-secondary); /* Secondary info */
```

---

## Troubleshooting New Sections

### Section Doesn't Appear
- Check that HTML ID matches renderer container name
- Verify `renderSection()` is called in `render()`
- Check browser console for errors
- Ensure data exists in `cvData` object

### Styling Issues
- Use browser DevTools to inspect elements
- Check CSS specificity conflicts
- Verify CSS variable names are correct
- Test with multiple content lengths

### PDF Layout Problems
- Add `page-break-inside: avoid` to entries
- Reduce margins or spacing if overflow
- Test with dummy content to verify layout
- Check PDF margins match CSS variables

---

## Complete Working Example

See the existing sections in this project:
- **Work History** - Complex entries with lists
- **Education** - Simple entries with metadata
- **Skills** - Categorized list layout
- **Competencies** - Grid badge layout

Each demonstrates different patterns you can follow.

---

Good luck extending your CV system! 🚀
