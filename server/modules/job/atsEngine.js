/**
 * ATS Engine — scores a candidate profile against a parsed job.
 * Returns 0-100 score with keyword breakdown.
 */

const { skillNamesList } = require('../../utils/skillHelpers');

/**
 * Tokenize text into meaningful words.
 */
const tokenize = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#\.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
};

/**
 * Get all text content from a profile for ATS scoring.
 */
const flattenProfile = (profile) => {
  const parts = [
    profile.summary || '',
    skillNamesList(profile.skills).join(' '),
    (profile.experience || [])
      .map((e) => `${e.title || ''} ${e.company || ''} ${e.description || ''} ${(e.achievements || []).join(' ')}`)
      .join(' '),
    (profile.education || [])
      .map((e) => `${e.degree || ''} ${e.field || ''} ${e.institution || ''}`)
      .join(' '),
    (profile.certifications || []).join(' '),
  ];
  return parts.join(' ');
};

/**
 * Calculate ATS match score.
 *
 * @param {object} parsedJob - Output from jobParser.parseJob()
 * @param {object} profile - User profile object
 * @returns {object} - { score, matchedKeywords, missingKeywords, breakdown }
 */
const scoreATS = (parsedJob, profile) => {
  const profileText = flattenProfile(profile);
  const profileTokens = new Set(tokenize(profileText));

  // Score technical skills (40% weight)
  const techMatched = parsedJob.technicalSkills.filter((s) =>
    tokenize(s).some((t) => profileTokens.has(t))
  );
  const techTotal = parsedJob.technicalSkills.length || 1;
  const techScore = Math.round((techMatched.length / techTotal) * 100);

  // Score top keywords (40% weight)
  const kwMatched = parsedJob.topKeywords.filter((kw) => profileTokens.has(kw));
  const kwTotal = parsedJob.topKeywords.length || 1;
  const kwScore = Math.round((kwMatched.length / kwTotal) * 100);

  // Score soft skills (20% weight)
  const softMatched = (parsedJob.softSkills || []).filter((s) =>
    tokenize(s).some((t) => profileTokens.has(t))
  );
  const softTotal = parsedJob.softSkills?.length || 1;
  const softScore = Math.round((softMatched.length / softTotal) * 100);

  // Weighted composite score
  const score = Math.round(techScore * 0.4 + kwScore * 0.4 + softScore * 0.2);

  // Missing keywords
  const missingKeywords = parsedJob.technicalSkills.filter(
    (s) => !tokenize(s).some((t) => profileTokens.has(t))
  );

  return {
    score: Math.min(100, score),
    matchedKeywords: [...techMatched, ...kwMatched.slice(0, 10)],
    missingKeywords: missingKeywords.slice(0, 15),
    breakdown: {
      technicalSkills: techScore,
      keywordMatch: kwScore,
      softSkills: softScore,
    },
    scoredAt: new Date().toISOString(),
  };
};

module.exports = { scoreATS };
