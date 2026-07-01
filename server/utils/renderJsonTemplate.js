// server/utils/renderJsonTemplate.js
/**
 * HTML rendering for document templates.
 * Used by the unified template engine — do not call directly from controllers.
 */
const { marked } = require('marked');

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(block = {}, userData = {}) {
  const type = String(block.type || '').trim().toLowerCase();
  const blockTitle = block.title || type.toUpperCase();
  let contentHtml = '';

  switch (type) {
    case 'profile': {
      const name = escapeHtml(userData.name || '');
      const email = escapeHtml(userData.email || '');
      const phone = escapeHtml(userData.phone || userData.phoneNumber || '');
      const location = escapeHtml(userData.location || '');
      const summary = userData.summary ? marked(String(userData.summary)) : '';
      const linkedin = escapeHtml(userData.linkedinUrl || userData.links?.linkedin || '');
      const github = escapeHtml(userData.githubUrl || userData.links?.github || '');

      contentHtml = `
        <div class="cv-profile-header">
          <h1 class="cv-name">${name}</h1>
          <div class="cv-contact-info">
            ${email ? `<span>${email}</span>` : ''}
            ${phone ? `<span> | ${phone}</span>` : ''}
            ${location ? `<span> | ${location}</span>` : ''}
          </div>
          <div class="cv-social-links">
            ${linkedin ? `<a href="${linkedin}" target="_blank">LinkedIn</a>` : ''}
            ${github ? `${linkedin ? ' | ' : ''}<a href="${github}" target="_blank">GitHub</a>` : ''}
          </div>
          ${summary ? `<div class="cv-summary">${summary}</div>` : ''}
        </div>
      `;
      break;
    }

    case 'experience': {
      const items = Array.isArray(userData.experience) ? userData.experience : [];
      if (items.length === 0) break;
      const itemsHtml = items.map(item => {
        const role = escapeHtml(item.role || item.title || '');
        const company = escapeHtml(item.company || '');
        const start = escapeHtml(item.startDate || '');
        const end = escapeHtml(item.endDate || 'Present');
        const desc = item.description ? marked(String(item.description)) : '';
        return `
          <div class="cv-experience-item">
            <div class="cv-item-header">
              <span class="cv-role"><strong>${role}</strong></span>
              <span class="cv-company">${company}</span>
              <span class="cv-dates">${start} - ${end}</span>
            </div>
            ${desc ? `<div class="cv-item-desc">${desc}</div>` : ''}
          </div>
        `;
      }).join('\n');

      contentHtml = `
        <div class="cv-experience-section">
          <h2 class="cv-section-title">${escapeHtml(blockTitle)}</h2>
          <hr />
          ${itemsHtml}
        </div>
      `;
      break;
    }

    case 'skills': {
      const items = Array.isArray(userData.skills) ? userData.skills : [];
      if (items.length === 0) break;
      const itemsHtml = items.map(skill => {
        const name = typeof skill === 'string' ? skill : (skill.name || '');
        return `<span class="cv-skill-badge">${escapeHtml(name)}</span>`;
      }).join('\n');

      contentHtml = `
        <div class="cv-skills-section">
          <h2 class="cv-section-title">${escapeHtml(blockTitle)}</h2>
          <hr />
          <div class="cv-skills-container">${itemsHtml}</div>
        </div>
      `;
      break;
    }

    case 'projects': {
      const items = Array.isArray(userData.projects) ? userData.projects : [];
      if (items.length === 0) break;
      const itemsHtml = items.map(item => {
        const title = escapeHtml(item.title || item.name || '');
        const link = escapeHtml(item.link || '');
        const desc = item.description ? marked(String(item.description)) : '';
        return `
          <div class="cv-project-item">
            <div class="cv-item-header">
              <span class="cv-project-title"><strong>${title}</strong></span>
              ${link ? `<a href="${link}" class="cv-project-link" target="_blank">${link}</a>` : ''}
            </div>
            ${desc ? `<div class="cv-item-desc">${desc}</div>` : ''}
          </div>
        `;
      }).join('\n');

      contentHtml = `
        <div class="cv-projects-section">
          <h2 class="cv-section-title">${escapeHtml(blockTitle)}</h2>
          <hr />
          ${itemsHtml}
        </div>
      `;
      break;
    }

    case 'education': {
      const items = Array.isArray(userData.education) ? userData.education : [];
      if (items.length === 0) break;
      const itemsHtml = items.map(item => {
        const degree = escapeHtml(item.degree || '');
        const field = escapeHtml(item.fieldOfStudy || '');
        const inst = escapeHtml(item.institution || item.school || '');
        const start = escapeHtml(item.startDate || '');
        const end = escapeHtml(item.endDate || '');
        return `
          <div class="cv-education-item">
            <div class="cv-item-header">
              <span class="cv-degree"><strong>${degree}${field ? ` in ${field}` : ''}</strong></span>
              <span class="cv-institution">${inst}</span>
              <span class="cv-dates">${start} ${end ? `- ${end}` : ''}</span>
            </div>
          </div>
        `;
      }).join('\n');

      contentHtml = `
        <div class="cv-education-section">
          <h2 class="cv-section-title">${escapeHtml(blockTitle)}</h2>
          <hr />
          ${itemsHtml}
        </div>
      `;
      break;
    }

    case 'certificates':
    case 'certifications': {
      const items = Array.isArray(userData.certificates) ? userData.certificates : 
                    (Array.isArray(userData.certifications) ? userData.certifications : []);
      if (items.length === 0) break;
      const itemsHtml = items.map(item => {
        const name = typeof item === 'string' ? item : (item.name || '');
        const authority = item.authority || item.issuer || '';
        const date = item.date || item.issueDate || '';
        return `
          <div class="cv-certificate-item">
            <div class="cv-item-header">
              <span class="cv-cert-name"><strong>${escapeHtml(name)}</strong>${authority ? ` - ${escapeHtml(authority)}` : ''}</span>
              ${date ? `<span class="cv-dates">${escapeHtml(date)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('\n');

      contentHtml = `
        <div class="cv-certificates-section">
          <h2 class="cv-section-title">${escapeHtml(blockTitle)}</h2>
          <hr />
          ${itemsHtml}
        </div>
      `;
      break;
    }

    default:
      break;
  }

  return `<div class="cv-block cv-block-${escapeHtml(type)}">${contentHtml}</div>`;
}

function renderLayout(layout = {}, blocks = {}, userData = {}) {
  const type = String(layout.type || 'single-column').trim().toLowerCase();

  if (type === 'two-column') {
    const columns = Array.isArray(layout.columns) ? layout.columns : [];
    const colsHtml = columns.map(col => {
      const width = col.width || '50%';
      const blocksHtml = (Array.isArray(col.blocks) ? col.blocks : []).map(blockKey => {
        const block = blocks[blockKey] || { type: blockKey };
        return renderBlock(block, userData);
      }).join('\n');
      return `<div class="cv-column" style="width: ${width}; flex-basis: ${width};">${blocksHtml}</div>`;
    }).join('\n');

    return `<div class="cv-layout-two-column">${colsHtml}</div>`;
  }

  // Fallback: single-column
  const blockKeys = Array.isArray(layout.blocks) ? layout.blocks : Object.keys(blocks);
  const blocksHtml = blockKeys.map(blockKey => {
    const block = blocks[blockKey] || { type: blockKey };
    return renderBlock(block, userData);
  }).join('\n');

  return `<div class="cv-layout-single-column">${blocksHtml}</div>`;
}

function renderTemplate(templateJson = {}, userData = {}) {
  const layout = templateJson.layout || {};
  const blocks = templateJson.blocks || {};
  const style = templateJson.style || {};

  const fontFamily = escapeHtml(style.fontFamily || 'Inter, "Segoe UI", sans-serif');
  const primaryColor = escapeHtml(style.primaryColor || '#111111');
  const fontSize = style.fontSize ? (typeof style.fontSize === 'number' ? `${style.fontSize}px` : escapeHtml(style.fontSize)) : '12px';
  const spacing = style.spacing ? (typeof style.spacing === 'number' ? `${style.spacing}px` : escapeHtml(style.spacing)) : '10px';

  const layoutHtml = renderLayout(layout, blocks, userData);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ${fontFamily};
      font-size: ${fontSize};
      color: #333333;
      line-height: 1.5;
    }
    .cv-container {
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .cv-container h1, .cv-container h2, .cv-container h3 {
      color: ${primaryColor};
      margin-top: 0;
      margin-bottom: 6px;
    }
    .cv-block {
      margin-bottom: ${spacing};
    }
    .cv-layout-single-column {
      display: flex;
      flex-direction: column;
      gap: ${spacing};
    }
    .cv-layout-two-column {
      display: flex;
      gap: 24px;
    }
    .cv-column {
      display: flex;
      flex-direction: column;
      gap: ${spacing};
    }
    .cv-name {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .cv-contact-info, .cv-social-links {
      font-size: 0.9rem;
      color: #666666;
      margin-bottom: 4px;
    }
    .cv-social-links a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .cv-social-links a:hover {
      text-decoration: underline;
    }
    .cv-summary {
      margin-top: 10px;
      font-size: 0.95rem;
    }
    .cv-experience-item, .cv-project-item, .cv-education-item {
      margin-bottom: 12px;
    }
    .cv-item-header {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .cv-item-desc {
      font-size: 0.9rem;
      color: #444444;
    }
    .cv-item-desc p {
      margin: 4px 0;
    }
    .cv-item-desc ul {
      margin: 4px 0;
      padding-left: 20px;
    }
    .cv-skill-badge {
      display: inline-block;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      margin: 2px;
    }
    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin-top: 2px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    ${layoutHtml}
  </div>
</body>
</html>`;
}

module.exports = {
  renderTemplate,
  renderBlock,
  renderLayout
};
