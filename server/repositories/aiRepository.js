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

const getAiSettings = (userId) => {
  const raw = fileStore.read(FILENAME, userId);
  const settings = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
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

const resolveFeatureConfig = (featureId, userId) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || "<empty>"}`);
  }
  const { getBillingExecutionMode } = require("../middleware/requestContext");
  if (getBillingExecutionMode() === "token") {
    const { getSystemFeatureConfig } = require("../services/billing/systemProviderKeys");
    return getSystemFeatureConfig(normalizedFeatureId);
  }
  const settings = getAiSettings(userId);
  return normalizeFeatureConfig(normalizedFeatureId, settings.featureMap[normalizedFeatureId]);
};

const resolveActivePrompt = (featureId, userId) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || "<empty>"}`);
  }
  const { resolvePrompt } = require("../domains/ai/core/promptRegistry");
  return resolvePrompt(normalizedFeatureId);
};

const updateFeatureConfig = (featureId, updates, userId) => {
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
    const currentSettings = getAiSettings(userId);
    return {
      featureId: normalizedFeatureId,
      ...normalizeFeatureConfig(normalizedFeatureId, currentSettings.featureMap[normalizedFeatureId]),
    };
  }

  const settings = getAiSettings(userId);
  const existing = normalizeFeatureConfig(normalizedFeatureId, settings.featureMap[normalizedFeatureId]);
  const merged = normalizeFeatureConfig(normalizedFeatureId, { ...existing, ...nextPartial });
  const nextFeatureMap = {
    ...settings.featureMap,
    [normalizedFeatureId]: merged,
  };

  saveAiSettings({ featureMap: nextFeatureMap }, userId);
  return {
    featureId: normalizedFeatureId,
    ...normalizeFeatureConfig(normalizedFeatureId, getAiSettings(userId).featureMap[normalizedFeatureId]),
  };
};

const saveAiSettings = (updates, userId) => {
  const current = getAiSettings(userId);
  const next = { ...current, ...updates };
  return fileStore.write(FILENAME, next, userId);
};

const upsertApiKey = ({ provider, apiKey, label = "Primary", isActive = true, userId }) => {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!SUPPORTED_AI_PROVIDERS.includes(normalizedProvider)) {
    throw new Error("Unsupported AI provider");
  }
  const normalizedApiKey = String(apiKey || "").trim();
  if (!normalizedApiKey) {
    throw new Error("API key is required");
  }
  const settings = getAiSettings(userId);
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

  saveAiSettings({ apiKeys: nextKeys }, userId);
  return { ...entry, encryptedApiKey: undefined, iv: undefined };
};

const getDecryptedKey = (provider, userId) => {
  const settings = getAiSettings(userId);
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const keyEntry = settings.apiKeys.find(k => k.provider === normalizedProvider && k.isActive);
  if (!keyEntry) return null;
  return decrypt(keyEntry.encryptedApiKey, keyEntry.iv);
};

const deleteApiKey = (provider, userId) => {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const settings = getAiSettings(userId);
  const nextKeys = settings.apiKeys.filter((k) => k.provider !== normalizedProvider);
  saveAiSettings({ apiKeys: nextKeys }, userId);
  return getAiSettings(userId);
};

const updateFeatureMap = (featureMap, userId) => {
  const incomingMap = featureMap && typeof featureMap === "object" ? featureMap : {};
  const normalizedMap = Object.keys(DEFAULT_FEATURE_MAP).reduce((acc, featureId) => {
    acc[featureId] = normalizeFeatureConfig(featureId, {
      ...DEFAULT_FEATURE_MAP[featureId],
      ...(incomingMap[featureId] || {}),
    });
    return acc;
  }, {});
  saveAiSettings({ featureMap: normalizedMap }, userId);
  return getAiSettings(userId).featureMap;
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
