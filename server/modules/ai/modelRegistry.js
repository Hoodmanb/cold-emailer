/**
 * Curated OpenRouter model registry with metadata.
 * Used by frontend model selector and backend for validation.
 */
const MODELS = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    speed: 'fast',
    cost: 'high',
    quality: 5,
    description: 'Best overall quality. Ideal for resumes and cover letters.',
    contextWindow: 128000,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    speed: 'very-fast',
    cost: 'low',
    quality: 4,
    description: 'Fast and affordable. Great for bulk email generation.',
    contextWindow: 128000,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    speed: 'fast',
    cost: 'high',
    quality: 5,
    description: 'Exceptional writing quality. Best for persuasive cover letters.',
    contextWindow: 200000,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    speed: 'very-fast',
    cost: 'low',
    quality: 3,
    description: 'Fastest Claude model. Good for quick drafts and analysis.',
    contextWindow: 200000,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    speed: 'medium',
    cost: 'medium',
    quality: 4,
    description: 'Strong European model. Excellent reasoning and precision.',
    contextWindow: 131000,
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    provider: 'Mistral AI',
    speed: 'fast',
    cost: 'very-low',
    quality: 3,
    description: 'Lightweight and free-tier friendly. Good for testing.',
    contextWindow: 32000,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'LLaMA 3.1 70B',
    provider: 'Meta',
    speed: 'medium',
    cost: 'low',
    quality: 4,
    description: 'Open-source powerhouse. Strong performance at low cost.',
    contextWindow: 131000,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'LLaMA 3.1 8B',
    provider: 'Meta',
    speed: 'very-fast',
    cost: 'very-low',
    quality: 3,
    description: 'Fastest open model. Best for development and testing.',
    contextWindow: 131000,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    speed: 'medium',
    cost: 'low',
    quality: 4,
    description: 'Advanced reasoning model. Excellent for job analysis.',
    contextWindow: 65000,
  },
  {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B',
    provider: 'Google',
    speed: 'fast',
    cost: 'very-low',
    quality: 3,
    description: "Google's efficient open model. Solid for structured tasks.",
    contextWindow: 8192,
  },
];

const getModels = () => MODELS;

const getModel = (id) => MODELS.find((m) => m.id === id) || null;

const isValidModel = (id) => MODELS.some((m) => m.id === id);

module.exports = { MODELS, getModels, getModel, isValidModel };
