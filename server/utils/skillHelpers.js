/**
 * Normalize skills from storage for use in prompts / ATS (string names only).
 * @param {unknown} skills
 * @returns {string[]}
 */
function skillNamesList(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (typeof s === 'string' ? s : s && typeof s === 'object' ? s.name : ''))
    .map((n) => String(n || '').trim())
    .filter(Boolean);
}

module.exports = { skillNamesList };
