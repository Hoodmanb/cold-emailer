/**
 * Pure Multimodal Vision OCR Image Job Extraction Pipeline
 */
const { resolveProvider } = require('../core/providerRouter');
const promptRegistry = require('../core/promptRegistry');
const { parseStructuredOutput, dedupeStringArray } = require('../core/parseStructuredOutput');
const aiStandards = require('../../../services/ai/aiGenerationStandards');

const executeImageExtractionPipeline = async (base64Image, mimeType, config) => {
  const promptTemplate = await promptRegistry.resolvePrompt('job_extraction_image');
  const provider = resolveProvider(config.provider);

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: promptTemplate },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
      ]
    }
  ];

  const raw = await provider({
    model: config.model,
    temperature: 0.1,
    max_tokens: 1500,
    messages
  });

  const parsed = parseStructuredOutput(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('[image-extraction-pipeline] Vision extraction output is not structured JSON.');
  }

  let out = { ...parsed };
  if (out.data && typeof out.data === 'object') {
    out = { ...out.data, schemaVersion: out.schemaVersion || aiStandards.SCHEMA_VERSION };
  }
  if (!out.schemaVersion) out.schemaVersion = aiStandards.SCHEMA_VERSION;
  if (Array.isArray(out.skills)) out.skills = dedupeStringArray(out.skills);
  if (Array.isArray(out.atsKeywords)) out.atsKeywords = dedupeStringArray(out.atsKeywords);

  return out;
};

module.exports = { executeImageExtractionPipeline };
