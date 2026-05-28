const { v4: uuidv4 } = require('uuid');

/**
 * Build canonical markdown for a project from structured fields.
 * Always use this as the single source for stored contentMd.
 */
function buildProjectMarkdown(p) {
  const title = (p.title || 'Untitled').trim();
  const summary = (p.summary || '').trim();
  const description = (p.description || '').trim();
  const tech = Array.isArray(p.technologies)
    ? p.technologies.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const gh = (p.links?.github || '').trim();
  const live = (p.links?.live || '').trim();
  const demoVideos = Array.isArray(p.demoVideos)
    ? p.demoVideos.map((v) => String(v || '').trim()).filter(Boolean).slice(0, 2)
    : [];
  const screenshots = Array.isArray(p.screenshots)
    ? p.screenshots
        .map((s) => ({
          type: String(s?.type || '').trim(),
          value: String(s?.value || '').trim(),
        }))
        .filter((s) => (s.type === 'upload' || s.type === 'url') && s.value)
        .slice(0, 2)
    : [];

  const parts = [`# ${title}`, '', '## Summary', summary || '_No summary._', ''];

  if (description) {
    parts.push('## Description', description, '');
  }

  if (tech.length) {
    parts.push('## Technologies', ...tech.map((t) => `- ${t}`), '');
  }

  parts.push('## Links', `- GitHub: ${gh || '—'}`, `- Live: ${live || '—'}`);
  if (demoVideos.length) {
    parts.push('', '## Demo Videos', ...demoVideos.map((v) => `- ${v}`));
  }
  if (screenshots.length) {
    parts.push('', '## Screenshots', ...screenshots.map((s) => `- [${s.type}] ${s.value}`));
  }
  return parts.join('\n');
}

/**
 * @param {object[]} projects
 */
function normalizeProjects(projects) {
  if (!Array.isArray(projects)) return [];
  const out = [];
  for (const raw of projects) {
    if (!raw || typeof raw !== 'object') continue;
    const tech = Array.isArray(raw.technologies)
      ? raw.technologies.map((t) => String(t).trim()).filter(Boolean)
      : typeof raw.technologies === 'string'
        ? raw.technologies.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

    const id = raw.id && String(raw.id).trim() ? String(raw.id).trim() : uuidv4();
    const title = String(raw.title || '').trim();
    if (!title) continue;

    const summary = String(raw.summary || '').trim();
    const description = String(raw.description || '').trim();
    const links = {
      github: String(raw.links?.github || '').trim(),
      live: String(raw.links?.live || '').trim(),
    };

    const row = {
      id,
      title,
      summary: summary || 'No summary',
      description,
      technologies: tech,
      links,
      demoVideos: Array.isArray(raw.demoVideos)
        ? raw.demoVideos.map((v) => String(v).trim()).filter(Boolean).slice(0, 2)
        : [],
      screenshots: Array.isArray(raw.screenshots)
        ? raw.screenshots
            .map((s) => ({
              type: String(s?.type || '').trim(),
              value: String(s?.value || '').trim(),
            }))
            .filter((s) => (s.type === 'upload' || s.type === 'url') && s.value)
            .slice(0, 2)
        : [],
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    row.contentMd = buildProjectMarkdown(row);
    out.push(row);
  }
  return out;
}

/**
 * Normalizes raw skill input (string or array) into a clean list of unique skill names.
 * Handles comma-separated values, mixed casing, and whitespace.
 * @param {string | string[]} input
 * @returns {string[]}
 */
function normalizeSkillsInput(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(',');
  const seen = new Set();
  return raw
    .map((s) => String(s || '').trim())
    .filter((s) => {
      if (!s) return false;
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function normalizeSkillRecords(skills) {
  if (!Array.isArray(skills)) {
    if (typeof skills === 'string') return normalizeSkillRecords(normalizeSkillsInput(skills));
    return [];
  }
  const seen = new Set();
  const out = [];
  for (const s of skills) {
    let name;
    let id;
    if (typeof s === 'string') {
      name = String(s).trim();
      id = uuidv4();
    } else if (s && typeof s === 'object') {
      name = String(s.name || '').trim();
      id = s.id && String(s.id).trim() ? String(s.id).trim() : uuidv4();
    } else continue;

    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ id, name });
  }
  return out;
}

function isValidUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(String(value).trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_err) {
    return false;
  }
}

function normalizeExperience(experience) {
  if (!Array.isArray(experience)) return [];
  return experience
    .map((exp) => {
      if (!exp || typeof exp !== "object") return null;

      const title = String(exp.title || "").trim();
      const company = String(exp.company || "").trim();
      if (!title || !company) return null;

      const companyLinks = Array.isArray(exp.companyLinks)
        ? exp.companyLinks
            .filter((l) => l && typeof l === "object" && isValidUrl(l.url))
            .map((l) => ({
              label: String(l.label || "").trim(),
              url: String(l.url).trim(),
            }))
            .slice(0, 2)
        : [];

      const achievements = Array.isArray(exp.achievements)
        ? exp.achievements.map((a) => String(a || "").trim()).filter(Boolean)
        : [];

      return {
        id: exp.id && String(exp.id).trim() ? String(exp.id).trim() : uuidv4(),
        title,
        company,
        startDate: String(exp.startDate || "").trim(),
        endDate: String(exp.endDate || "").trim(),
        current: exp.current === true,
        description: String(exp.description || "").trim(),
        achievements,
        companyLinks,
      };
    })
    .filter(Boolean);
}

function normalizeCertificates(certificates) {
  if (!Array.isArray(certificates)) return [];
  return certificates.map((cert) => {
    if (!cert || typeof cert !== 'object') return null;
    const link = String(cert.link || '').trim();
    if (!link || !isValidUrl(link)) return null;

    return {
      id: cert.id || uuidv4(),
      title: String(cert.title || '').trim(),
      link,
      awarder: String(cert.awarder || '').trim(),
      description: String(cert.description || '').trim(),
    };
  }).filter(Boolean);
}

/**
 * Prepare profile body for persistence (skills array, projects with contentMd).
 */
function normalizeProfilePayload(body) {
  if (!body || typeof body !== 'object') return body;
  const { skills, projects, experience, workExperience, certificates, githubUrl, linkedinUrl, phoneNumber, ...rest } = body;
  const next = { ...rest };
  if (skills !== undefined) next.skills = normalizeSkillRecords(skills);
  if (projects !== undefined) next.projects = normalizeProjects(projects);
  const exp = experience !== undefined ? experience : workExperience;
  if (exp !== undefined) next.experience = normalizeExperience(exp);
  if (certificates !== undefined) next.certificates = normalizeCertificates(certificates);

  if (githubUrl !== undefined) next.githubUrl = isValidUrl(githubUrl) ? String(githubUrl).trim() : "";
  if (linkedinUrl !== undefined) next.linkedinUrl = isValidUrl(linkedinUrl) ? String(linkedinUrl).trim() : "";
  if (phoneNumber !== undefined) next.phoneNumber = String(phoneNumber || "").trim();

  return next;
}

module.exports = {
  buildProjectMarkdown,
  normalizeProjects,
  normalizeSkillsInput,
  normalizeSkillRecords,
  normalizeExperience,
  normalizeCertificates,
  normalizeProfilePayload,
};
