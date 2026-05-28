"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import type { AIProviderModel, AISettingsData } from "@/types";
import FeatureHelpPopover from "@/components/settings/FeatureHelpPopover";
import { AlertCircle } from "lucide-react";

type FeatureDraftRow = {
  id?: string;
  provider: string;
  model: string;
  useCustomPrompt: boolean;
  customPrompt: string;
};

type FeatureUiState = {
  saving: boolean;
  message?: string;
  error?: string;
};

const PROVIDERS = ["openai", "claude", "gemini", "openrouter"];

function FeatureConfigCard({
  feature,
  row,
  models,
  providerConfigured,
  isDirty,
  ui,
  onSave,
  onReset,
  onUpdateDraft,
  onResetToDefault
}: {
  feature: any;
  row: any;
  models: AIProviderModel[];
  providerConfigured: boolean;
  isDirty: boolean;
  ui: any;
  onSave: () => void;
  onReset: () => void;
  onUpdateDraft: (patch: any) => void;
  onResetToDefault: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: row.useCustomPrompt ? "primary.light" : "divider",
        transition: "all 0.2s ease",
        overflow: "visible"
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2} sx={{ mb: 3 }}>
          <Box>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography variant="subtitle1" fontWeight={800}>{feature.name}</Typography>
              <FeatureHelpPopover featureId={feature.id} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{feature.description}</Typography>
            {!providerConfigured && (
              <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <AlertCircle size={12} /> Add API key for {row.provider} in Settings
              </Typography>
            )}
          </Box>

          <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
            <TextField
              select
              size="small"
              label="Provider"
              value={row.provider}
              sx={{ minWidth: 140 }}
              onChange={(e) => onUpdateDraft({ provider: e.target.value, model: "" })}
            >
              {PROVIDERS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Model"
              value={row.model}
              disabled={!providerConfigured}
              sx={{ minWidth: 220 }}
              onChange={(e) => onUpdateDraft({ model: e.target.value })}
            >
              {models.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={!isDirty || ui.saving}
              onClick={onSave}
              sx={{ minHeight: 40 }}
            >
              {ui.saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outlined"
              disabled={!isDirty || ui.saving}
              onClick={onReset}
              sx={{ minHeight: 40 }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1 }}>
                PROMPT INSTRUCTIONS
              </Typography>
              <FeatureHelpPopover featureId={feature.id} size={14} />
            </Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="caption" fontWeight={700} color={row.useCustomPrompt ? "primary.main" : "text.secondary"}>
                {row.useCustomPrompt ? "CUSTOM" : "DEFAULT"}
              </Typography>
              <Button
                size="small"
                variant={row.useCustomPrompt ? "contained" : "outlined"}
                sx={{ height: 24, fontSize: "0.65rem", borderRadius: 1.5 }}
                onClick={() => onUpdateDraft({ useCustomPrompt: !row.useCustomPrompt })}
              >
                {row.useCustomPrompt ? "Disable Custom" : "Enable Custom"}
              </Button>
            </Stack>
          </Stack>

          <TextField
            multiline
            fullWidth
            minRows={3}
            maxRows={12}
            value={row.useCustomPrompt ? row.customPrompt : feature.defaultPrompt}
            disabled={!row.useCustomPrompt}
            placeholder="Enter custom prompt instructions..."
            InputProps={{
              sx: {
                fontFamily: "'Roboto Mono', monospace",
                fontSize: "0.85rem",
                bgcolor: row.useCustomPrompt ? "background.paper" : "transparent"
              }
            }}
            onChange={(e) => onUpdateDraft({ customPrompt: e.target.value })}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" color={isDirty ? "warning.main" : "text.secondary"} fontWeight={700}>
              {isDirty ? "Unsaved changes" : "Saved"}
            </Typography>
            {row.useCustomPrompt && (
              <Button
                size="small"
                color="primary"
                onClick={onResetToDefault}
                sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
              >
                Reset to Default
              </Button>
            )}
            {!!ui.error && (
              <Typography variant="caption" color="error.main" fontWeight={700}>
                {ui.error}
              </Typography>
            )}
            {!ui.error && !!ui.message && (
              <Typography variant="caption" color="success.main" fontWeight={700}>
                {ui.message}
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

interface AISettingsProps {
  onDirtyChange: (isDirty: boolean) => void;
  initialDrafts: {
    keysForm?: any;
    featuresForm?: any;
  };
  onUpdateDrafts: (drafts: any) => void;
}

export default function AISettings({
  onDirtyChange,
  initialDrafts,
  onUpdateDrafts,
}: AISettingsProps) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [settings, setSettings] = useState<AISettingsData | null>(null);
  
  // Local forms state
  const [formProvider, setFormProvider] = useState(initialDrafts.keysForm?.formProvider || "openai");
  const [formLabel, setFormLabel] = useState(initialDrafts.keysForm?.formLabel || "Primary");
  const [formApiKey, setFormApiKey] = useState(initialDrafts.keysForm?.formApiKey || "");

  const [modelsByProvider, setModelsByProvider] = useState<Record<string, AIProviderModel[]>>({});
  const [featureMapDraft, setFeatureMapDraft] = useState<Record<string, any>>(initialDrafts.featuresForm || {});
  const [featureUiState, setFeatureUiState] = useState<Record<string, FeatureUiState>>({});

  const normalizeFeatureRow = (row: any): FeatureDraftRow => ({
    id: typeof row?.id === "string" ? row.id : undefined,
    provider: PROVIDERS.includes(String(row?.provider || "").toLowerCase())
      ? String(row.provider).toLowerCase()
      : "openrouter",
    model: String(row?.model || "").trim(),
    useCustomPrompt: row?.useCustomPrompt === true,
    customPrompt: typeof row?.customPrompt === "string" ? row.customPrompt : "",
  });

  const setFeatureState = (featureId: string, patch: FeatureUiState) => {
    setFeatureUiState((prev) => ({ ...prev, [featureId]: { ...(prev[featureId] || { saving: false }), ...patch } }));
  };

  const fetchSettings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [s, m] = await Promise.all([
        axiosInstance.get("/api/settings/ai"),
        axiosInstance.get("/api/settings/ai/models"),
      ]);
      if (s.data?.success && m.data?.success) {
        setSettings(s.data.data);
        
        // Group models by provider
        const grouped = (m.data.data || []) as Array<{ provider: string; models: AIProviderModel[] }>;
        const map: Record<string, AIProviderModel[]> = {};
        grouped.forEach((g) => {
          map[g.provider] = g.models;
        });
        setModelsByProvider(map);

        // Establish base and local draft only if we don't have existing draft
        const serverDraft = Object.entries(s.data.data.featureMap || {}).reduce((acc, [featureId, row]) => {
          acc[featureId] = normalizeFeatureRow(row);
          return acc;
        }, {} as Record<string, FeatureDraftRow>);

        if (Object.keys(featureMapDraft).length === 0) {
          setFeatureMapDraft(serverDraft);
          onUpdateDrafts({
            keysForm: { formProvider, formLabel, formApiKey },
            featuresForm: serverDraft,
          });
        }
      } else {
        showSnackbar(s.data?.message || "Failed to load settings", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to load settings", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  // Monitor updates to inform parent of drafts state
  useEffect(() => {
    onUpdateDrafts({
      keysForm: { formProvider, formLabel, formApiKey },
      featuresForm: featureMapDraft,
    });
  }, [formProvider, formLabel, formApiKey, featureMapDraft]);

  // Compute overall dirty state
  const isDirty = useMemo(() => {
    if (!settings?.featureMap) return false;
    // Check key fields
    if (formApiKey !== "") return true;

    // Check individual feature modifications
    for (const [featureId, originalRow] of Object.entries(settings.featureMap)) {
      const draft = featureMapDraft[featureId];
      if (!draft) continue;
      const baseline = normalizeFeatureRow(originalRow);
      if (JSON.stringify(draft) !== JSON.stringify(baseline)) {
        return true;
      }
    }
    return false;
  }, [settings, featureMapDraft, formApiKey]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const configuredProviders = useMemo(() => {
    const entries = settings?.apiKeys || [];
    return new Set(entries.filter((x) => x.isActive).map((x) => x.provider));
  }, [settings]);

  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const testConnection = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await axiosInstance.post("/api/settings/ai/test-connection", { provider });
      if (res.data?.success) showSnackbar(res.data.message, "success");
      else showSnackbar(res.data?.message || "Connection failed", "error");
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message || "Connection test failed", "error");
    } finally {
      setTestingProvider(null);
    }
  };

  const upsertKey = async () => {
    if (!formApiKey.trim()) return showSnackbar("API key is required", "error");
    setSavingKey(true);
    try {
      const res = await axiosInstance.put("/api/settings/ai/keys", {
        provider: formProvider,
        apiKey: formApiKey,
        label: formLabel,
        isActive: true,
      });
      if (res.data?.success) {
        showSnackbar("API key saved successfully", "success");
        setFormApiKey("");
        await fetchSettings(false);
      } else {
        showSnackbar(res.data?.message || "Failed to save API key", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save API key", "error");
    } finally {
      setSavingKey(false);
    }
  };

  const saveFeature = async (featureId: string) => {
    const row = normalizeFeatureRow(featureMapDraft[featureId]);
    const payload = {
      provider: row.provider,
      model: row.model,
      useCustomPrompt: row.useCustomPrompt,
      customPrompt: row.customPrompt,
    };

    if (!payload.model) {
      setFeatureState(featureId, { saving: false, error: "Select a model before saving.", message: undefined });
      showSnackbar("Select a model before saving", "error");
      return;
    }

    setFeatureState(featureId, { saving: true, error: undefined, message: undefined });
    try {
      const res = await axiosInstance.patch(`/api/settings/ai/feature-config/${encodeURIComponent(featureId)}`, payload);
      if (res.data?.success) {
        setFeatureState(featureId, { saving: false, message: "Saved", error: undefined });
        showSnackbar("Feature configuration saved", "success");
        await fetchSettings(false);
      } else {
        const msg = res.data?.message || "Failed to update feature";
        setFeatureState(featureId, { saving: false, error: msg, message: undefined });
        showSnackbar(msg, "error");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update feature";
      setFeatureState(featureId, { saving: false, error: msg, message: undefined });
      showSnackbar(msg, "error");
    }
  };

  const resetFeature = (featureId: string) => {
    const source = settings?.featureMap?.[featureId];
    if (!source) return;
    setFeatureMapDraft((prev) => ({ ...prev, [featureId]: normalizeFeatureRow(source) }));
    setFeatureState(featureId, { saving: false, error: undefined, message: "Reset" });
  };

  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 4, py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={36} />
      </Card>
    );
  }

  return (
    <Stack gap={4}>
      {/* API Keys Panel */}
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack gap={3}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                AI Provider Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure your personal credentials for LLM engines. API keys are stored securely using active end-to-end encryption hashes.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  size="small"
                  label="Provider"
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  fullWidth
                >
                  {PROVIDERS.map((provider) => (
                    <MenuItem key={provider} value={provider}>
                      {provider}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  size="small"
                  label="Label"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  size="small"
                  label="API Key"
                  type="password"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                <Button
                  variant="contained"
                  onClick={upsertKey}
                  disabled={savingKey || !formApiKey.trim()}
                  fullWidth
                  sx={{ minHeight: 40 }}
                >
                  {savingKey ? "Saving..." : "Save key"}
                </Button>
              </Grid>
            </Grid>

            {/* List Existing Keys */}
            <Stack gap={1.5} sx={{ mt: 1 }}>
              {(settings?.apiKeys || []).map((key) => (
                <Alert
                  key={key.id}
                  severity={key.isActive ? "success" : "info"}
                  sx={{ borderRadius: 2, alignItems: "center" }}
                  action={
                    <Stack direction="row" gap={0.5}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={testingProvider === key.provider}
                        onClick={() => testConnection(key.provider)}
                        sx={{ minHeight: 32 }}
                      >
                        {testingProvider === key.provider ? "Testing..." : "Test"}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        sx={{ minHeight: 32 }}
                        onClick={async () => {
                          const res = await axiosInstance.delete(`/api/settings/ai/keys/${encodeURIComponent(key.provider)}`);
                          if (res.data?.success) {
                            showSnackbar("Credential deleted", "success");
                            await fetchSettings(false);
                          } else {
                            showSnackbar(res.data?.message || "Failed to remove key", "error");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {String(key.provider).toUpperCase()} ({key.label}) — <code style={{ fontFamily: "monospace", fontSize: "0.9em" }}>{key.maskedPreview || "encrypted"}</code>
                  </Typography>
                </Alert>
              ))}
              {(settings?.apiKeys || []).length === 0 && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No provider credentials stored. AI features will not work until you add an API key above.
                </Alert>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Feature Workflows list */}
      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          AI Feature Workflows
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure how each AI feature behaves, including model selection and custom prompt instructions.
        </Typography>
      </Box>

      <Stack gap={3}>
        {Object.values(settings?.featureMap || {}).map((feature: any) => {
          const row = normalizeFeatureRow(
            featureMapDraft[feature.id] || { provider: "openai", model: "", useCustomPrompt: false, customPrompt: "" }
          );
          const models = modelsByProvider[row.provider] || [];
          const providerConfigured = configuredProviders.has(row.provider);
          const baseline = normalizeFeatureRow(settings?.featureMap?.[feature.id]);
          const cardIsDirty = JSON.stringify(row) !== JSON.stringify(baseline);
          const ui = featureUiState[feature.id] || { saving: false };

          return (
            <FeatureConfigCard
              key={feature.id}
              feature={feature}
              row={row}
              models={models}
              providerConfigured={providerConfigured}
              isDirty={cardIsDirty}
              ui={ui}
              onSave={() => void saveFeature(feature.id)}
              onReset={() => resetFeature(feature.id)}
              onUpdateDraft={(patch) => {
                setFeatureMapDraft((prev) => ({ ...prev, [feature.id]: { ...row, ...patch } }));
              }}
              onResetToDefault={() => {
                const next = { ...row, customPrompt: String(feature.defaultPrompt || "") };
                setFeatureMapDraft((prev) => ({ ...prev, [feature.id]: next }));
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
