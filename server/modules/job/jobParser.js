/**
 * Job Parser — extracts structured data from a raw job description.
 * Uses heuristic pattern matching + simple NLP.
 */

const COMMON_TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
  'react', 'next.js', 'vue', 'angular', 'svelte', 'node.js', 'express', 'fastapi', 'django',
  'flask', 'spring', 'rails', 'laravel',
  'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'dynamodb', 'firebase',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'github actions',
  'graphql', 'rest', 'api', 'microservices', 'websockets',
  'machine learning', 'deep learning', 'nlp', 'pytorch', 'tensorflow',
  'html', 'css', 'tailwind', 'sass', 'figma',
  'git', 'linux', 'bash', 'agile', 'scrum',
];

const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
  'adaptability', 'creativity', 'time management', 'collaboration', 'attention to detail',
];

const SENIORITY_PATTERNS = {
  junior: /\b(junior|entry.?level|0[\-–]2 years?|fresh graduate|new grad)\b/i,
  mid: /\b(mid.?level|3[\-–]5 years?|intermediate)\b/i,
  senior: /\b(senior|sr\.?|lead|5\+|7\+|8\+ years?)\b/i,
  staff: /\b(staff|principal|architect|director|vp|head of)\b/i,
};

const JOB_TYPE_PATTERNS = {
  fulltime: /\b(full.?time|permanent|ft)\b/i,
  parttime: /\b(part.?time|pt)\b/i,
  contract: /\b(contract|freelance|temporary|temp|consulting)\b/i,
  remote: /\b(remote|work from home|wfh|distributed)\b/i,
  hybrid: /\b(hybrid)\b/i,
};

/**
 * Extract keywords from text matching a word list.
 */
const extractKeywords = (text, wordList) => {
  const lower = text.toLowerCase();
  return wordList.filter((kw) => lower.includes(kw.toLowerCase()));
};

/**
 * Extract salary range if mentioned.
 */
const extractSalary = (text) => {
  const match = text.match(/\$(\d[\d,k]*)\s*(?:[-–to]+\s*\$?(\d[\d,k]*))?(?:\s*(?:per year|\/yr|annual|annually|pa))?/i);
  if (!match) return null;
  return {
    min: match[1]?.replace(/,/g, ''),
    max: match[2]?.replace(/,/g, '') || null,
    raw: match[0],
  };
};

/**
 * Extract years of experience requirement.
 */
const extractYearsRequired = (text) => {
  const match = text.match(/(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)/i);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Detect seniority level from text.
 */
const detectSeniority = (text) => {
  for (const [level, pattern] of Object.entries(SENIORITY_PATTERNS)) {
    if (pattern.test(text)) return level;
  }
  return 'unspecified';
};

/**
 * Detect job type/work arrangement.
 */
const detectJobTypes = (text) => {
  return Object.entries(JOB_TYPE_PATTERNS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([type]) => type);
};

/**
 * Parse a raw job description into structured data.
 * @param {string} rawText - The raw job description
 * @param {object} meta - Optional metadata (title, company, location)
 * @returns {object} - Structured job data
 */
const parseJob = (rawText, meta = {}) => {
  if (!rawText || typeof rawText !== 'string') {
    return { error: 'Invalid job description text' };
  }

  const technicalSkills = extractKeywords(rawText, COMMON_TECH_SKILLS);
  const softSkills = extractKeywords(rawText, SOFT_SKILLS);
  const yearsRequired = extractYearsRequired(rawText);
  const seniority = detectSeniority(rawText);
  const jobTypes = detectJobTypes(rawText);
  const salary = extractSalary(rawText);

  // Extract all meaningful words as general keywords (for ATS scoring)
  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s+#\.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['that', 'this', 'with', 'from', 'will', 'have', 'your', 'their', 'about', 'would', 'could', 'should'].includes(w));

  const wordFreq = {};
  words.forEach((w) => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

  const topKeywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([word]) => word);

  return {
    title: meta.title || '',
    company: meta.company || '',
    location: meta.location || '',
    seniority,
    jobTypes,
    yearsRequired,
    salary,
    technicalSkills,
    softSkills,
    topKeywords,
    wordCount: rawText.split(/\s+/).length,
    parsedAt: new Date().toISOString(),
  };
};

module.exports = { parseJob };
