"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { CheckCircle2, Search, Trash2, HelpCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import {
  adminApi,
  type ModelCatalog,
  type ModelVerificationResult,
} from "@/lib/adminApi";

type CatalogRow = {
  provider: string;
  id: string;
  name: string;
  source: "baseline" | "custom";
};

function flattenCatalog(catalog?: ModelCatalog): CatalogRow[] {
  if (!catalog) return [];
  return catalog.groups.flatMap((group) =>
    group.models.map((model) => ({
      provider: group.provider,
      id: model.id,
      name: model.name,
      source: model.source || "baseline",
    })),
  );
}

function providerLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function ModelCatalogManager() {
  const qc = useQueryClient();
  const [provider, setProvider] = useState("openrouter");
  const [modelId, setModelId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [verification, setVerification] = useState<ModelVerificationResult | null>(null);
  const [snackbar, setSnackbar] = useState("");

  const catalogQuery = useQuery({
    queryKey: ["admin", "model-catalog"],
    queryFn: () => adminApi.get<ModelCatalog>("/api/admin/billing/model-catalog"),
  });

  const rows = useMemo(() => flattenCatalog(catalogQuery.data), [catalogQuery.data]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      try {
        const { data } = await axiosInstance.post(
          "/api/admin/billing/model-catalog/verify",
          { provider, model: modelId.trim() },
          { headers: { "X-Bypass-Global-Toast": "true" } },
        );
        return (data?.data || data) as ModelVerificationResult;
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string; data?: ModelVerificationResult } };
        };
        const payload = axiosError.response?.data;
        if (payload?.data) return payload.data;
        return {
          valid: false,
          message: payload?.message || "Verification failed",
        } satisfies ModelVerificationResult;
      }
    },
    onSuccess: (result) => {
      setVerification(result);
      if (result.valid && result.upstreamName && !displayName.trim()) {
        setDisplayName(result.upstreamName);
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: () =>
      adminApi.post<{ entry: CatalogRow; catalog: ModelCatalog }>(
        "/api/admin/billing/model-catalog/models",
        {
          provider,
          model: modelId.trim(),
          name: displayName.trim() || verification?.upstreamName || modelId.trim(),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "model-catalog"] });
      setModelId("");
      setDisplayName("");
      setVerification(null);
      setSnackbar("Model added to app-wide catalog");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setSnackbar(axiosError.response?.data?.message || "Failed to add model");
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ rowProvider, rowModel }: { rowProvider: string; rowModel: string }) =>
      adminApi.delete<{ provider: string; model: string }>(
        "/api/admin/billing/model-catalog/models",
        { provider: rowProvider, model: rowModel },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "model-catalog"] });
      setSnackbar("Custom model removed");
    },
    onError: () => setSnackbar("Failed to remove model"),
  });

  const resetVerification = () => setVerification(null);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    resetVerification();
  };

  const handleModelChange = (value: string) => {
    setModelId(value);
    resetVerification();
  };

  const alreadyExists = rows.some(
    (row) => row.provider === provider && row.id === modelId.trim(),
  );

  const canVerify = Boolean(provider && modelId.trim() && !alreadyExists);
  const canAdd = Boolean(
    verification?.valid &&
      modelId.trim() &&
      !alreadyExists &&
      !addMutation.isPending,
  );

  const columns: DataTableColumn<CatalogRow>[] = [
    {
      id: "provider",
      label: "Provider",
      render: (row) => providerLabel(row.provider),
    },
    { id: "id", label: "Model ID", render: (row) => row.id },
    { id: "name", label: "Display Name", render: (row) => row.name },
    {
      id: "source",
      label: "Source",
      render: (row) => (
        <Chip
          size="small"
          label={row.source === "baseline" ? "Built-in" : "Custom"}
          color={row.source === "baseline" ? "default" : "primary"}
          variant={row.source === "baseline" ? "outlined" : "filled"}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (row) =>
        row.source === "custom" ? (
          <Button
            size="small"
            color="error"
            startIcon={<Trash2 size={14} />}
            disabled={removeMutation.isPending}
            onClick={() =>
              removeMutation.mutate({ rowProvider: row.provider, rowModel: row.id })
            }
          >
            Remove
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Locked
          </Typography>
        ),
    },
  ];

  if (catalogQuery.isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton height={48} />
        <Skeleton height={240} />
      </Stack>
    );
  }

  if (catalogQuery.isError) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => catalogQuery.refetch()}>Retry</Button>}
      >
        Failed to load model catalog.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <ConfigSectionCard
        helpId="models.add"
        title="Add Model"
        description="Verify the model exists with the provider API before adding it app-wide"
      >
        <Stack spacing={2} maxWidth={640}>
          <Stack direction="row" alignItems="center" gap={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select label="Provider" value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
                {(catalogQuery.data?.providers ?? []).map((entry) => (
                  <MenuItem key={entry} value={entry}>
                    {providerLabel(entry)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="The AI provider hosting the model (e.g. OpenAI, Anthropic, OpenRouter)." arrow>
              <Box sx={{ color: "text.secondary", cursor: "help", flexShrink: 0 }}>
                <HelpCircle size={16} />
              </Box>
            </Tooltip>
          </Stack>

          <TextField
            size="small"
            label="Model ID"
            placeholder={
              provider === "openrouter"
                ? "e.g. deepseek/deepseek-r1"
                : "e.g. gpt-4o-mini"
            }
            value={modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            helperText="Use the exact model id from the provider"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The unique string identifier used by the provider's API (e.g., anthropic/claude-3-5-sonnet)." arrow>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                      <HelpCircle size={16} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small"
            label="Display name"
            placeholder="Shown in admin and AI settings"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!verification?.valid}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="A user-friendly name displayed to users in the app settings." arrow>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                      <HelpCircle size={16} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          {alreadyExists && (
            <Alert severity="info">This model is already in the catalog.</Alert>
          )}

          {verification && (
            <Alert severity={verification.valid ? "success" : "error"} icon={verification.valid ? <CheckCircle2 size={18} /> : undefined}>
              {verification.message}
              {verification.valid && verification.upstreamName && (
                <Typography variant="caption" display="block" mt={0.5}>
                  Provider name: {verification.upstreamName}
                </Typography>
              )}
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Search size={16} />}
              disabled={!canVerify || verifyMutation.isPending}
              onClick={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? "Verifying…" : "Verify Model"}
            </Button>
            <Button
              variant="contained"
              disabled={!canAdd}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? "Adding…" : "Add to Catalog"}
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Verification uses system API keys from env, or the active key in Settings → AI if no system key is set.
          </Typography>
        </Stack>
      </ConfigSectionCard>

      <ConfigSectionCard
        helpId="models.catalog"
        title="App-wide Model Catalog"
        description={`${rows.length} models available to AI settings and billing markup`}
      >
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => `${row.provider}:${row.id}`}
          emptyMessage="No models in catalog"
        />
      </ConfigSectionCard>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}
