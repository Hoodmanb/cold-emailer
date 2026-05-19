/**
 * Normalize a string: lowercase + trim whitespace.
 */
const normalizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim();
};

module.exports = normalizeString;
