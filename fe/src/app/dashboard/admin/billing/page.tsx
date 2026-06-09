"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Alert,
  Skeleton,
  Snackbar,
} from "@mui/material";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BillingGlobalSettings from "@/components/admin/billing/BillingGlobalSettings";
import ProviderModelTable from "@/components/admin/billing/ProviderModelTable";
import FeaturePricingTable from "@/components/admin/billing/FeaturePricingTable";
import BillingSnapshotsPanel from "@/components/admin/billing/BillingSnapshotsPanel";
import GatewaySettings from "@/components/admin/billing/GatewaySettings";
import CreditPacksTable from "@/components/admin/billing/CreditPacksTable";
import {
  adminApi,
  type BillingConfig,
  type ProviderModelEntry,
  type FeatureEntry,
  configToProviderRows,
  configToFeatureRows,
  rowsToConfig,
} from "@/lib/adminApi";

export default function AdminBillingPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [providers, setProviders] = useState<ProviderModelEntry[]>([]);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [providerRowsValid, setProviderRowsValid] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "billing-config"],
    queryFn: () => adminApi.get<BillingConfig>("/api/admin/billing/config"),
  });

  useEffect(() => {
    if (!data) return;
    setConfig(data);
    setProviders(configToProviderRows(data));
    setFeatures(configToFeatureRows(data));
    setRawJson(JSON.stringify(data, null, 2));
    setSavedSnapshot(JSON.stringify({ config: data, providers: configToProviderRows(data), features: configToFeatureRows(data) }));
  }, [data]);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ config, providers, features }),
    [config, providers, features],
  );

  const isDirty = Boolean(savedSnapshot && currentSnapshot !== savedSnapshot);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const saveMutation = useMutation({
    mutationFn: async (payload: BillingConfig) =>
      adminApi.put<BillingConfig>("/api/admin/billing/config", payload),
    onSuccess: (next) => {
      setConfig(next);
      setProviders(configToProviderRows(next));
      setFeatures(configToFeatureRows(next));
      setRawJson(JSON.stringify(next, null, 2));
      setSavedSnapshot(JSON.stringify({ config: next, providers: configToProviderRows(next), features: configToFeatureRows(next) }));
      qc.invalidateQueries({ queryKey: ["admin", "billing-config"] });
      setSnackbar({ open: true, message: "Billing configuration saved", severity: "success" });
    },
    onError: () => {
      setSnackbar({ open: true, message: "Failed to save billing configuration", severity: "error" });
    },
  });

  const handleGlobalChange = useCallback((field: keyof BillingConfig, value: number) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSave = () => {
    if (!config) return;
    let payload = rowsToConfig(config, providers, features);
    if (showAdvanced) {
      try {
        payload = JSON.parse(rawJson) as BillingConfig;
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON — fix syntax before saving");
        return;
      }
    }
    saveMutation.mutate(payload);
  };

  const handleRawJsonChange = (value: string) => {
    setRawJson(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON syntax");
    }
  };

  if (isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton height={48} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </Stack>
    );
  }

  if (isError || !config) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Retry</Button>}
      >
        Failed to load billing configuration.
      </Alert>
    );
  }

  const versionLabel = config.versionId || config.id || "billing-config";

  return (
    <Box maxWidth={1100}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} mb={3} gap={2}>
        <AdminPageHeader
          helpId="page.billing"
          title="Billing Configuration"
          description={`Manage global pricing, model markups, and feature costs · ${versionLabel}`}
          mb={0}
        />
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          disabled={!isDirty || saveMutation.isPending || Boolean(jsonError) || !providerRowsValid}
          onClick={handleSave}
        >
          {saveMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </Stack>

      {isDirty && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. Save before leaving this page.
        </Alert>
      )}

      <Stack spacing={3}>
        <BillingGlobalSettings config={config} onChange={handleGlobalChange} disabled={saveMutation.isPending} />
        <ProviderModelTable
          rows={providers}
          onChange={setProviders}
          onValidityChange={setProviderRowsValid}
          disabled={saveMutation.isPending}
        />
        <FeaturePricingTable rows={features} onChange={setFeatures} disabled={saveMutation.isPending} />
        <BillingSnapshotsPanel
          config={config}
          showAdvanced={showAdvanced}
          onToggleAdvanced={setShowAdvanced}
          rawJson={rawJson}
          onRawJsonChange={handleRawJsonChange}
          jsonError={jsonError}
        />
        <GatewaySettings />
        <CreditPacksTable />
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
