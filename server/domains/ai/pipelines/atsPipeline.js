/**
 * Pure ATS Match Evaluation Generation Pipeline
 * Enforces anti-hallucination guardrails and structured parsing.
 */
const { resolveProvider } = require('../core/providerRouter');
const { parseStructuredOutput, wrapUntrustedBlock } = require('../core/parseStructuredOutput');
const promptRegistry = require('../core/promptRegistry');
const aiStandards = require('../../../services/ai/aiGenerationStandards');

const executeAtsPipeline = async (job, profile, config) => {
  const promptTemplate = await promptRegistry.resolvePrompt('ats_analysis');
  const jobBlob = job.rawDescription || JSON.stringify(job.parsedData || {});
  const profileBlob = JSON.stringify(profile, null, 2);

  const buildPrompt = (jobPart, profilePart, withReminder = false) => {
    let body = promptRegistry.render(promptTemplate, {
      job_description: wrapUntrustedBlock('JOB_DESCRIPTION', jobPart),
      candidate_profile: wrapUntrustedBlock('CANDIDATE_PROFILE', profilePart),
    });
    if (withReminder) {
      body = `${body}\n\n${aiStandards.RETRY_REMINDER_USER}`;
    }
    return body;
  };

  const systemPrompt = aiStandards.buildAtsSystemPrompt();
  const provider = resolveProvider(config.provider);

  let lastError = null;
  const attempts = [
    { temp: 0.22, max_tokens: 1200, reminder: false, shorten: false, strict: false },
    { temp: 0, max_tokens: 1200, reminder: true, shorten: false, strict: false },
    { temp: 0, max_tokens: 1000, reminder: true, shorten: true, strict: true }
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const jobPart = attempt.shorten ? aiStandards.flattenForRetryContext(jobBlob, 6500) : jobBlob;
    const profilePart = attempt.shorten ? aiStandards.flattenForRetryContext(profileBlob, 8000) : profileBlob;
    const userContent = buildPrompt(jobPart, profilePart, attempt.reminder);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const opts = {
      model: config.model,
      temperature: attempt.temp,
      max_tokens: attempt.max_tokens,
      messages
    };

    try {
      const raw = await provider(opts);
      const parsed = parseStructuredOutput(raw);
      if (!parsed) continue;

      const envelope = aiStandards.coerceAtsEnvelope(parsed, {
        jobText: String(jobBlob),
        profileText: String(profileBlob),
      });

      if (envelope?.data && typeof envelope.data.score === 'number' && !Number.isNaN(envelope.data.score)) {
        return { ...envelope, ...envelope.data };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[ATS-Pipeline] Try ${i + 1} failed: ${err.message}`);
    }
  }

  throw new Error(`ATS analysis pipeline failed: ${lastError?.message || 'Exhausted structure retries'}`);
};

const ATS_FALLBACK = {
  score: 0,
  matchedKeywords: [],
  missingKeywords: [],
  breakdown: {},
  schemaVersion: aiStandards.SCHEMA_VERSION,
  meta: { source: 'fallback', reason: 'ai_unavailable' },
};

const executeAtsPipelineSafe = async (job, profile, config) => {
  try {
    return await executeAtsPipeline(job, profile, config);
  } catch (err) {
    console.warn('[ATS-Pipeline] Falling back after AI failure:', err.message);
    return { ...ATS_FALLBACK };
  }
};

module.exports = { executeAtsPipeline, executeAtsPipelineSafe, ATS_FALLBACK };
