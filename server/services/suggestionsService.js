const recipientRepo = require('../repositories/recipientRepository');
const templateRepo = require('../repositories/templateRepository');
const smtpRepo = require('../repositories/smtpRepository');
const { sanitizeSmtp } = require('../utils/sanitizeSmtp');

function sortSuggestionRows(rows) {
  return [...rows].sort((a, b) => {
    const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    const ua = Number(a.usageCount) || 0;
    const ub = Number(b.usageCount) || 0;
    if (ub !== ua) return ub - ua;
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  });
}

function parseLimit(query, fallback = 8, max = 20) {
  const n = parseInt(String(query?.limit || ''), 10);
  if (Number.isFinite(n) && n > 0) return Math.min(n, max);
  return fallback;
}

function getRecipientSuggestions(limit) {
  const all = recipientRepo.listRecipients();
  return sortSuggestionRows(all).slice(0, limit).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    usageCount: r.usageCount || 0,
    lastUsedAt: r.lastUsedAt || null,
    category: r.category || '',
    createdAt: r.createdAt || null,
  }));
}

function getTemplateSuggestions(limit) {
  const all = templateRepo.listTemplates();
  const sorted = sortSuggestionRows(all);
  return sorted.slice(0, limit).map((t) => {
    const body = t.body || '';
    return {
      id: t.id,
      name: t.name,
      subject: t.subject || '',
      bodySnippet: body.length > 120 ? `${body.slice(0, 120)}…` : body,
      usageCount: t.usageCount || 0,
      lastUsedAt: t.lastUsedAt || null,
      createdAt: t.createdAt || null,
    };
  });
}

function getSmtpSuggestions(limit) {
  const all = smtpRepo
    .getAllSmtps()
    .filter((s) => s.status === 'verified')
    .map(sanitizeSmtp);

  const sorted = [...all].sort((a, b) => {
    const da = a.isDefault ? 1 : 0;
    const db = b.isDefault ? 1 : 0;
    if (db !== da) return db - da;
    const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  });

  return sorted.slice(0, limit);
}

module.exports = {
  getRecipientSuggestions,
  getTemplateSuggestions,
  getSmtpSuggestions,
  parseLimit,
  sortSuggestionRows,
};
