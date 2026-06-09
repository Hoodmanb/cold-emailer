"use client";

import React, { useMemo } from "react";
import {
  Alert,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import {
  adminApi,
  type ModelCatalog,
  type ProviderModelEntry,
  findNextAvailableProviderModel,
  getModelsForProvider,
  isKnownProviderModel,
} from "@/lib/adminApi";

type Props = {
  rows: ProviderModelEntry[];
  onChange: (rows: ProviderModelEntry[]) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
};

function providerLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function ProviderModelTable({
  rows,
  onChange,
  onValidityChange,
  disabled,
}: Props) {
  const catalogQuery = useQuery({
    queryKey: ["admin", "model-catalog"],
    queryFn: () => adminApi.get<ModelCatalog>("/api/admin/billing/model-catalog"),
  });

  const catalog = catalogQuery.data;

  const usedPairs = useMemo(
    () => new Set(rows.map((row) => `${row.provider}:${row.model}`)),
    [rows],
  );

  const allRowsValid = useMemo(() => {
    if (!catalog) return true;
    return rows.every(
      (row) =>
        row.provider &&
        row.model &&
        isKnownProviderModel(catalog, row.provider, row.model),
    );
  }, [catalog, rows]);

  React.useEffect(() => {
    onValidityChange?.(allRowsValid);
  }, [allRowsValid, onValidityChange]);

  const updateRow = (index: number, patch: Partial<ProviderModelEntry>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const deleteRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    if (!catalog) return;
    const next = findNextAvailableProviderModel(catalog, rows);
    if (!next) return;
    onChange([...rows, { ...next, markup: 1, active: true }]);
  };

  const canAddRow = Boolean(
    catalog && findNextAvailableProviderModel(catalog, rows),
  );

  const modelOptionsForRow = (row: ProviderModelEntry, index: number) => {
    if (!catalog || !row.provider) return [];
    const models = getModelsForProvider(catalog, row.provider);
    if (row.model && !models.some((entry) => entry.id === row.model)) {
      return [{ id: row.model, name: `${row.model} (unknown — pick a valid model)` }, ...models];
    }
    return models;
  };

  const columns: DataTableColumn<ProviderModelEntry>[] = [
    {
      id: "provider",
      label: "Provider",
      render: (row, index) => (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <FormControl size="small" sx={{ minWidth: 140 }} disabled={disabled || !catalog}>
            <InputLabel>Provider</InputLabel>
            <Select
              label="Provider"
              value={row.provider || ""}
              onChange={(e) => {
                const provider = e.target.value;
                const models = catalog ? getModelsForProvider(catalog, provider) : [];
                const firstAvailable =
                  models.find(
                    (model) =>
                      !rows.some(
                        (entry, rowIndex) =>
                          rowIndex !== index &&
                          entry.provider === provider &&
                          entry.model === model.id,
                      ),
                  )?.id ?? models[0]?.id ?? "";
                updateRow(index, { provider, model: firstAvailable });
              }}
            >
              {(catalog?.providers ?? []).map((provider) => (
                <MenuItem key={provider} value={provider}>
                  {providerLabel(provider)}
                </MenuItem>
              ))}
              {row.provider &&
                !catalog?.providers.includes(row.provider) && (
                  <MenuItem value={row.provider}>{row.provider} (unknown)</MenuItem>
                )}
            </Select>
          </FormControl>
          <Tooltip title="The provider hosting the model (e.g., OpenAI, OpenRouter)." arrow>
            <Box sx={{ color: "text.secondary", cursor: "help", flexShrink: 0 }}>
              <HelpCircle size={14} />
            </Box>
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "model",
      label: "Model",
      render: (row, index) => (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled || !row.provider}>
            <InputLabel>Model</InputLabel>
            <Select
              label="Model"
              value={row.model || ""}
              onChange={(e) => updateRow(index, { model: e.target.value })}
            >
              {modelOptionsForRow(row, index).map((model) => {
                const pairKey = `${row.provider}:${model.id}`;
                const usedByOther =
                  rows.some(
                    (entry, rowIndex) =>
                      rowIndex !== index &&
                      entry.provider === row.provider &&
                      entry.model === model.id,
                  ) || (usedPairs.has(pairKey) && row.model !== model.id);

                return (
                  <MenuItem key={model.id} value={model.id} disabled={usedByOther}>
                    {model.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Tooltip title="The specific AI model to configure." arrow>
            <Box sx={{ color: "text.secondary", cursor: "help", flexShrink: 0 }}>
              <HelpCircle size={14} />
            </Box>
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "markup",
      label: "Markup",
      render: (row, index) => (
        <TextField
          size="small"
          type="number"
          disabled={disabled}
          value={row.markup}
          onChange={(e) => updateRow(index, { markup: Number(e.target.value) })}
          inputProps={{ step: 0.01, min: 0 }}
          sx={{ width: 100 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="The multiplier markup rate for this specific model (e.g. 1.25 represents 25% markup)." arrow>
                  <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                    <HelpCircle size={14} />
                  </Box>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      ),
    },
    {
      id: "active",
      label: "Active",
      render: (row, index) => (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Switch
            checked={row.active}
            disabled={disabled}
            onChange={(e) => updateRow(index, { active: e.target.checked })}
          />
          <Tooltip title="Enable or disable usage of this model." arrow>
            <Box sx={{ color: "text.secondary", cursor: "help", flexShrink: 0 }}>
              <HelpCircle size={14} />
            </Box>
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, index) => (
        <Tooltip title="Delete row">
          <span>
            <IconButton size="small" disabled={disabled} onClick={() => deleteRow(index)}>
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];

  if (catalogQuery.isLoading) {
    return (
      <ConfigSectionCard
        helpId="billing.providerMarkup"
        title="Provider / Model Markup"
        description="Loading model catalog from server…"
      >
        <Stack gap={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={48} />
          ))}
        </Stack>
      </ConfigSectionCard>
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
    <ConfigSectionCard
      helpId="billing.providerMarkup"
      title="Provider / Model Markup"
      description="Same provider and model list used by AI feature settings"
      action={
        <Button
          size="small"
          startIcon={<Plus size={16} />}
          disabled={disabled || !canAddRow}
          onClick={addRow}
        >
          Add Row
        </Button>
      }
    >
      {!allRowsValid && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some rows use unknown provider/model pairs. Select valid options from the dropdowns before saving.
        </Alert>
      )}

      {rows.length === 0 ? (
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            No markup overrides yet. Add a provider/model pair from the catalog.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={16} />}
            disabled={disabled || !canAddRow}
            onClick={addRow}
          >
            Add first row
          </Button>
        </Stack>
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(_, i) => `provider-${i}`} />
      )}
    </ConfigSectionCard>
  );
}
