/**
 * Schema validator for AI-generated JSON outputs.
 * Validates before passing to document models / template engine.
 * If validation fails the pipeline aborts cleanly — no broken PDFs.
 */

// ─── Required field checks per feature ───────────────────────────────────────

const SCHEMAS = {
  resume_generation: {
    required: ['contact', 'summary', 'experience', 'skills'],
    arrays: ['experience', 'skills', 'education', 'certifications', 'atsKeywords'],
    nested: {
      contact: ['name'],
    },
  },
  cover_letter_generation: {
    required: ['paragraphs', 'closing'],
    arrays: ['paragraphs'],
    nested: {},
  },
  email_generation: {
    required: ['subject', 'body'],
    arrays: [],
    nested: {},
  },
  ats_analysis: {
    required: ['score', 'matchedKeywords', 'missingKeywords', 'breakdown'],
    arrays: ['matchedKeywords', 'missingKeywords'],
    nested: {
      breakdown: ['technicalSkills', 'keywordMatch', 'softSkills'],
    },
  },
  project_summary_generation: {
    required: ['title', 'summary'],
    arrays: ['technologies', 'highlights'],
    nested: {},
  },
  advanced_doc_generation: {
    required: ['title', 'executiveSummary', 'sections'],
    arrays: ['sections'],
    nested: {},
  },
};

/**
 * Validates a raw AI JSON object against the feature schema.
 * @param {string} featureId
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(featureId, data) {
  const schema = SCHEMAS[featureId];
  const errors = [];

  // Features without a schema pass through (e.g. chatbot, job_extraction_image)
  if (!schema) {
    return { valid: true, errors: [] };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: [`Expected a JSON object for featureId "${featureId}", got ${typeof data}`] };
  }

  // Check required top-level fields
  for (const field of schema.required) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Check array fields are actually arrays
  for (const field of schema.arrays) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      errors.push(`Field "${field}" must be an array, got ${typeof data[field]}`);
    }
  }

  // Check nested required fields
  for (const [parent, fields] of Object.entries(schema.nested)) {
    if (data[parent] && typeof data[parent] === 'object') {
      for (const field of fields) {
        if (data[parent][field] === undefined || data[parent][field] === null) {
          errors.push(`Missing required nested field: "${parent}.${field}"`);
        }
      }
    } else if (data[parent] !== undefined) {
      errors.push(`Field "${parent}" must be an object`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Strips markdown fences and attempts to parse JSON from an AI response string.
 * @param {string} raw
 * @returns {object|null}
 */
function parseAIJson(raw) {
  const cleaned = String(raw || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

module.exports = { validate, parseAIJson, SCHEMAS };
