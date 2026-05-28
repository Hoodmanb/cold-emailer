/**
 * Universal Post-Processing JSON Parsing & Security Sanitizer
 * Governed strictly by the repository's AI Generation Standards.
 */
const { asErrorMessage } = require('../../../utils/safeError');

/**
 * Clean markdown fences and prose fluff.
 */
function cleanProse(text) {
  let cleaned = String(text || '').trim();
  // Strip starting ```json and ending ```
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

/**
 * Safely extracts the primary JSON object substring from model output.
 */
function extractJsonSubstring(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && start < end) {
    return text.substring(start, end + 1);
  }
  return text;
}

/**
 * Deduplicates and cleans string lists.
 */
function dedupeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(
    arr
      .filter((s) => s && typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
  )];
}

/**
 * Standard structured parser
 */
function parseStructuredOutput(rawText, options = {}) {
  let text = cleanProse(rawText);
  try {
    return JSON.parse(text);
  } catch (_) {
    // Attempt parsing substring fallback
    try {
      const sub = extractJsonSubstring(text);
      return JSON.parse(sub);
    } catch (err) {
      throw new Error(`[structured-parser] Failed parsing JSON model response: ${asErrorMessage(err)}. Raw payload: ${rawText.substring(0, 150)}...`);
    }
  }
}

/**
 * Wrap untrusted content block (against prompt-injection attacks)
 */
function wrapUntrustedBlock(label, untrustedData) {
  const cleanLabel = String(label || 'DATA').toUpperCase();
  return `[START OF UNTRUSTED DATA BLOCK: ${cleanLabel}]\n${untrustedData}\n[END OF UNTRUSTED DATA BLOCK: ${cleanLabel}]`;
}

module.exports = {
  cleanProse,
  parseStructuredOutput,
  dedupeStringArray,
  wrapUntrustedBlock
};
