/**
 * Email Scorer — evaluates AI-generated cold emails on three dimensions.
 * Fast, heuristic-based scoring (no AI call needed).
 */

const { skillNamesList } = require('../../utils/skillHelpers');

/**
 * Score personalization level (0-100).
 * Checks if the email references company name, role, specific details.
 */
const scorePersonalization = (emailBody, recipientData = {}, jobData = {}) => {
  let score = 30; // Base score
  const lowerBody = emailBody.toLowerCase();

  const companyName = (jobData.company || recipientData.company || '').toLowerCase();
  const roleName = (jobData.title || '').toLowerCase();
  const recipientName = (recipientData.name || '').toLowerCase();

  if (companyName && lowerBody.includes(companyName)) score += 20;
  if (roleName && lowerBody.includes(roleName.split(' ')[0])) score += 15;
  if (recipientName && lowerBody.includes(recipientName.split(' ')[0])) score += 15;

  // Check for generic openers (negative signal)
  const genericOpeners = ['i hope this email', 'i am writing to', 'to whom it may', 'dear hiring manager'];
  if (genericOpeners.some((g) => lowerBody.includes(g))) score -= 20;

  // Specific signal words
  const specificWords = ['specifically', 'noticed', 'impressed', 'recently', 'your team', 'your product', 'your work'];
  const found = specificWords.filter((w) => lowerBody.includes(w));
  score += found.length * 5;

  return Math.max(0, Math.min(100, score));
};

/**
 * Score relevance to job (0-100).
 * Checks if email body mentions job-relevant keywords.
 */
const scoreRelevance = (emailBody, jobData = {}, profile = {}) => {
  let score = 20; // Base score
  const lowerBody = emailBody.toLowerCase();

  const jobKeywords = [
    ...(jobData.parsedData?.technicalSkills || []),
    ...(jobData.parsedData?.topKeywords || []).slice(0, 10),
  ].map((k) => k.toLowerCase());

  const profileSkills = skillNamesList(profile.skills).map((s) => s.toLowerCase());

  // Job keyword matches in email
  const matchedJobKw = jobKeywords.filter((kw) => lowerBody.includes(kw));
  score += Math.min(40, matchedJobKw.length * 8);

  // Profile skill mentions
  const matchedProfileKw = profileSkills.filter((s) => lowerBody.includes(s));
  score += Math.min(30, matchedProfileKw.length * 6);

  // Has clear CTA
  const ctaWords = ['call', 'chat', 'connect', 'available', 'schedule', 'discuss', '15 min', '30 min'];
  if (ctaWords.some((w) => lowerBody.includes(w))) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Score tone match (0-100).
 * Heuristic analysis of professional vs desperate tone.
 */
const scoreTone = (emailBody) => {
  let score = 60; // Start mid-range
  const lowerBody = emailBody.toLowerCase();
  const wordCount = emailBody.split(/\s+/).length;

  // Length penalty (too long = bad for cold email)
  if (wordCount > 200) score -= 20;
  if (wordCount > 150) score -= 10;
  if (wordCount < 50) score -= 15;

  // Desperation signals (negative)
  const desperationWords = ['please', 'urgent', 'asap', 'really need', 'struggling', 'begging', 'any opportunity'];
  const foundDesperation = desperationWords.filter((w) => lowerBody.includes(w));
  score -= foundDesperation.length * 10;

  // Confidence signals (positive)
  const confidenceWords = ['achieved', 'led', 'built', 'increased', 'delivered', 'launched', 'improved'];
  const foundConfidence = confidenceWords.filter((w) => lowerBody.includes(w));
  score += foundConfidence.length * 5;

  // Professional closing
  const closings = ['best regards', 'kind regards', 'best,', 'thanks,', 'sincerely'];
  if (closings.some((c) => lowerBody.includes(c))) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Score an email on all three dimensions.
 */
const scoreEmail = (emailBody, { recipientData, jobData, profile } = {}) => {
  const personalization = scorePersonalization(emailBody, recipientData, jobData);
  const relevance = scoreRelevance(emailBody, jobData, profile);
  const tone = scoreTone(emailBody);
  const overall = Math.round((personalization + relevance + tone) / 3);

  return { personalization, relevance, tone, overall };
};

module.exports = { scoreEmail };
