/**
 * AI Tailoring Level Configuration
 * Maps user-facing slider values to prompt instructions and temperature adjustments.
 */

const VALID_LEVELS = ['conservative', 'balanced', 'aggressive'];

const TAILORING_PROFILES = {
  conservative: {
    label: 'Conservative',
    temperatureOffset: -0.15,
    instructions: [
      'Use ONLY skills, experience, and qualifications explicitly stated in the candidate profile.',
      'Do NOT infer, assume, or embellish any capabilities not directly evidenced.',
      'Minimal keyword injection — only include job keywords that genuinely match existing experience.',
      'Prioritize accuracy and truthfulness over ATS optimization.',
      'Use straightforward, resume-safe language without exaggeration.',
    ].join(' '),
  },
  balanced: {
    label: 'Balanced',
    temperatureOffset: 0,
    instructions: [
      'Moderately optimize content for the target job description.',
      'Carefully infer adjacent and transferable skills where reasonable and believable.',
      'Improve ATS keyword alignment using existing experience as the foundation.',
      'Enhance phrasing strategically while keeping all claims grounded in the profile.',
      'Balance competitiveness with credibility.',
    ].join(' '),
  },
  aggressive: {
    label: 'Aggressive',
    temperatureOffset: 0.12,
    instructions: [
      'Strongly optimize for ATS keyword alignment with the job description.',
      'Infer adjacent capabilities and transferable skills where professionally reasonable.',
      'Use competitive, confident positioning language.',
      'Maximize keyword density from the job description using existing experience as anchor points.',
      'Do NOT fabricate impossible experience, degrees, or employers — keep output believable and human.',
    ].join(' '),
  },
};

function normalizeTailoringLevel(level) {
  const raw = String(level || 'balanced').toLowerCase().trim();
  return VALID_LEVELS.includes(raw) ? raw : 'balanced';
}

function resolveTailoringConfig(level, baseTemperature = 0.5) {
  const normalized = normalizeTailoringLevel(level);
  const profile = TAILORING_PROFILES[normalized];
  const temperature = Math.min(1, Math.max(0, baseTemperature + profile.temperatureOffset));
  return {
    level: normalized,
    label: profile.label,
    temperature,
    instructions: profile.instructions,
    promptSuffix: `\n\nTAILORING MODE (${profile.label.toUpperCase()}): ${profile.instructions}`,
  };
}

module.exports = {
  VALID_LEVELS,
  TAILORING_PROFILES,
  normalizeTailoringLevel,
  resolveTailoringConfig,
};
