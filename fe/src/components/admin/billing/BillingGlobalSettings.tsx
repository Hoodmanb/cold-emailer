"use client";

import React from "react";
import { Grid, TextField, InputAdornment, Tooltip, Box } from "@mui/material";
import { HelpCircle } from "lucide-react";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import type { BillingConfig } from "@/lib/adminApi";

type Props = {
  config: BillingConfig;
  onChange: (field: keyof BillingConfig, value: number) => void;
  disabled?: boolean;
};

const FIELDS: Array<{ key: keyof BillingConfig; label: string; tooltip: string; step?: number; min?: number }> = [
  {
    key: "credit_value_usd",
    label: "Credit value (USD per credit)",
    tooltip: "The monetary value in USD of a single credit (e.g., 0.01 means 1 cent per credit).",
    step: 0.01,
    min: 0,
  },
  {
    key: "minimum_credit_charge",
    label: "Minimum credit charge",
    tooltip: "The minimum credit cost billed for any credit-consuming action.",
    step: 1,
    min: 0,
  },
  {
    key: "global_ai_markup_multiplier",
    label: "Global AI markup multiplier",
    tooltip: "Multiplier applied to raw AI generation costs to calculate final user cost (e.g., 1.5 adds a 50% markup).",
    step: 0.01,
    min: 1,
  },
  {
    key: "minimum_ai_charge_credits",
    label: "Minimum AI charge (credits)",
    tooltip: "The absolute minimum credits charged for any single AI text/document generation request.",
    step: 1,
    min: 0,
  },
  {
    key: "minimum_feature_charge_credits",
    label: "Minimum feature charge (credits)",
    tooltip: "The minimum credit charge for using advanced feature tools.",
    step: 1,
    min: 0,
  },
  {
    key: "percentage_bonus_on_purchase",
    label: "Purchase bonus (%)",
    tooltip: "Extra credit percentage awarded to users when they purchase credit packages.",
    step: 1,
    min: 0,
  },
];

export default function BillingGlobalSettings({ config, onChange, disabled }: Props) {
  return (
    <ConfigSectionCard
      helpId="billing.globalSettings"
      title="Global Billing Settings"
      description="Core pricing multipliers and credit economics"
    >
      <Grid container spacing={2}>
        {FIELDS.map(({ key, label, tooltip, step, min }) => (
          <Grid key={key} size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={label}
              type="number"
              disabled={disabled}
              value={config[key] ?? ""}
              onChange={(e) => onChange(key, Number(e.target.value))}
              inputProps={{ step, min }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={tooltip} arrow>
                      <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                        <HelpCircle size={16} />
                      </Box>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        ))}
      </Grid>
    </ConfigSectionCard>
  );
}
