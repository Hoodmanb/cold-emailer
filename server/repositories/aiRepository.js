const fileStore = require("../utils/fileStore");
const { encrypt, decrypt } = require("../utils/encryption");
const { v4: uuidv4 } = require("uuid");

const FILENAME = "ai-configs.json";
const SUPPORTED_AI_PROVIDERS = ["openai", "claude", "gemini", "openrouter"];

const { AI_FEATURES } = require("../services/ai/featureConfigs");

const DEFAULT_FEATURE_MAP = AI_FEATURES.reduce((acc, f) => {
  acc[f.id] = {
    provider: "openrouter",
    model: f.id === "ats_analysis" ? "deepseek/deepseek-r1" : "openai/gpt-4o-mini",
    useCustomPrompt: false,
    customPrompt: "",
  };
  return acc;
}, {});

function maskApiKey(raw) {
  const key = String(raw || "");
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(Math.max(4, key.length));
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

const getAiSettings = () => {
  const settings = fileStore.read(FILENAME);
  const featureMap = { ...DEFAULT_FEATURE_MAP };

  // Deep merge feature map to ensure all keys exist
  if (settings.featureMap) {
    Object.keys(settings.featureMap).forEach((id) => {
      if (featureMap[id]) {
        featureMap[id] = { ...featureMap[id], ...settings.featureMap[id] };
      }
    });
  }

  return {
    apiKeys: settings.apiKeys || [],
    featureMap,
  };
};

const FEATURE_IDS = new Set(AI_FEATURES.map((f) => f.id));

function normalizeFeatureConfig(featureId, value) {
  const fallback = DEFAULT_FEATURE_MAP[featureId] || {
    provider: "openrouter",
    model: "openai/gpt-4o-mini",
    useCustomPrompt: false,
    customPrompt: "",
  };
  const raw = value && typeof value === "object" ? value : {};
  const provider = SUPPORTED_AI_PROVIDERS.includes(String(raw.provider || "").trim().toLowerCase())
    ? String(raw.provider).trim().toLowerCase()
    : fallback.provider;
  return {
    provider,
    model: String(raw.model || fallback.model || "").trim(),
    useCustomPrompt: raw.useCustomPrompt === true,
    customPrompt: typeof raw.customPrompt === "string" ? raw.customPrompt : "",
  };
}

const resolveFeatureConfig = (featureId) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || "<empty>"}`);
  }
  const settings = getAiSettings();
  return normalizeFeatureConfig(normalizedFeatureId, settings.featureMap[normalizedFeatureId]);
};

const resolveActivePrompt = (featureId) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || "<empty>"}`);
  }
  const { resolvePrompt } = require("../domains/ai/core/promptRegistry");
  return resolvePrompt(normalizedFeatureId);
};

const updateFeatureConfig = (featureId, updates) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || "<empty>"}`);
  }

  const safeUpdates = updates && typeof updates === "object" ? updates : {};
  const allowedFields = ["provider", "model", "useCustomPrompt", "customPrompt"];
  const nextPartial = {};
  for (const field of allowedFields) {
    if (safeUpdates[field] !== undefined) {
      nextPartial[field] = safeUpdates[field];
    }
  }

  if (Object.keys(nextPartial).length === 0) {
    const currentSettings = getAiSettings();
    return {
      featureId: normalizedFeatureId,
      ...normalizeFeatureConfig(normalizedFeatureId, currentSettings.featureMap[normalizedFeatureId]),
    };
  }

  const settings = getAiSettings();
  const existing = normalizeFeatureConfig(normalizedFeatureId, settings.featureMap[normalizedFeatureId]);
  const merged = normalizeFeatureConfig(normalizedFeatureId, { ...existing, ...nextPartial });
  const nextFeatureMap = {
    ...settings.featureMap,
    [normalizedFeatureId]: merged,
  };

  saveAiSettings({ featureMap: nextFeatureMap });
  return {
    featureId: normalizedFeatureId,
    ...normalizeFeatureConfig(normalizedFeatureId, getAiSettings().featureMap[normalizedFeatureId]),
  };
};

const saveAiSettings = (updates) => {
  const current = getAiSettings();
  const next = { ...current, ...updates };
  return fileStore.write(FILENAME, next);
};

const upsertApiKey = ({ provider, apiKey, label = "Primary", isActive = true }) => {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!SUPPORTED_AI_PROVIDERS.includes(normalizedProvider)) {
    throw new Error("Unsupported AI provider");
  }
  const normalizedApiKey = String(apiKey || "").trim();
  if (!normalizedApiKey) {
    throw new Error("API key is required");
  }
  const settings = getAiSettings();
  const { encryptedPassword, iv } = encrypt(normalizedApiKey);

  const existingIdx = settings.apiKeys.findIndex(k => k.provider === normalizedProvider);
  const entry = {
    id: existingIdx >= 0 ? settings.apiKeys[existingIdx].id : uuidv4(),
    provider: normalizedProvider,
    encryptedApiKey: encryptedPassword,
    iv,
    label,
    isActive,
    maskedPreview: maskApiKey(normalizedApiKey),
    createdAt: existingIdx >= 0 ? settings.apiKeys[existingIdx].createdAt : new Date().toISOString(),
  };

  const nextKeys = [...settings.apiKeys];
  if (existingIdx >= 0) {
    nextKeys[existingIdx] = entry;
  } else {
    nextKeys.push(entry);
  }

  saveAiSettings({ apiKeys: nextKeys });
  return { ...entry, encryptedApiKey: undefined, iv: undefined };
};

const getDecryptedKey = (provider) => {
  const settings = getAiSettings();
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const keyEntry = settings.apiKeys.find(k => k.provider === normalizedProvider && k.isActive);
  if (!keyEntry) return null;
  return decrypt(keyEntry.encryptedApiKey, keyEntry.iv);
};

const deleteApiKey = (provider) => {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const settings = getAiSettings();
  const nextKeys = settings.apiKeys.filter((k) => k.provider !== normalizedProvider);
  saveAiSettings({ apiKeys: nextKeys });
  return getAiSettings();
};

const updateFeatureMap = (featureMap) => {
  const incomingMap = featureMap && typeof featureMap === "object" ? featureMap : {};
  const normalizedMap = Object.keys(DEFAULT_FEATURE_MAP).reduce((acc, featureId) => {
    acc[featureId] = normalizeFeatureConfig(featureId, {
      ...DEFAULT_FEATURE_MAP[featureId],
      ...(incomingMap[featureId] || {}),
    });
    return acc;
  }, {});
  saveAiSettings({ featureMap: normalizedMap });
  return getAiSettings().featureMap;
};

module.exports = {
  getAiSettings,
  saveAiSettings,
  resolveFeatureConfig,
  resolveActivePrompt,
  updateFeatureConfig,
  upsertApiKey,
  deleteApiKey,
  updateFeatureMap,
  getDecryptedKey,
  SUPPORTED_AI_PROVIDERS,
  DEFAULT_FEATURE_MAP,
};
