"use client";

import React from "react";
import {
  Button,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  InputAdornment,
  Box,
} from "@mui/material";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import type { FeatureEntry } from "@/lib/adminApi";

type Props = {
  rows: FeatureEntry[];
  onChange: (rows: FeatureEntry[]) => void;
  disabled?: boolean;
};

export default function FeaturePricingTable({ rows, onChange, disabled }: Props) {
  const updateRow = (index: number, patch: Partial<FeatureEntry>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const deleteRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { name: "", cost: 0, custom: true }]);
  };

  const columns: DataTableColumn<FeatureEntry>[] = [
    {
      id: "name",
      label: "Feature",
      render: (row, index) => (
        <TextField
          size="small"
          disabled={disabled || !row.custom}
          value={row.name}
          onChange={(e) => updateRow(index, { name: e.target.value })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="The identifier name of the platform feature." arrow>
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
      id: "cost",
      label: "Cost (credits)",
      render: (row, index) => (
        <TextField
          size="small"
          type="number"
          disabled={disabled}
          value={row.cost}
          onChange={(e) => updateRow(index, { cost: Number(e.target.value) })}
          inputProps={{ step: 1, min: 0 }}
          sx={{ width: 120 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="The credit cost charged per usage of this feature." arrow>
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
      id: "custom",
      label: "Custom",
      render: (row) => (
        <Switch checked={!!row.custom} disabled title={row.custom ? "Custom feature" : "Core feature"} />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (row, index) => (
        <Tooltip title={row.custom ? "Delete feature" : "Core features cannot be deleted"}>
          <span>
            <IconButton
              size="small"
              disabled={disabled || !row.custom}
              onClick={() => deleteRow(index)}
            >
              <Trash2 size={16} />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];

  return (
    <ConfigSectionCard
      helpId="billing.featurePricing"
      title="Feature Pricing"
      description="Credit cost per platform feature"
      action={
        <Button size="small" startIcon={<Plus size={16} />} disabled={disabled} onClick={addRow}>
          Add Feature
        </Button>
      }
    >
      <DataTable columns={columns} rows={rows} getRowKey={(_, i) => `feature-${i}`} />
    </ConfigSectionCard>
  );
}
