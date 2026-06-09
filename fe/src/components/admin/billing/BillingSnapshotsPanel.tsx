"use client";

import React from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Tooltip,
  InputAdornment,
  Stack,
} from "@mui/material";
import { HelpCircle } from "lucide-react";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import type { BillingConfig } from "@/lib/adminApi";

type Props = {
  config: BillingConfig;
  showAdvanced: boolean;
  onToggleAdvanced: (value: boolean) => void;
  onRawJsonChange: (json: string) => void;
  rawJson: string;
  jsonError?: string | null;
};

export default function BillingSnapshotsPanel({
  config,
  showAdvanced,
  onToggleAdvanced,
  onRawJsonChange,
  rawJson,
  jsonError,
}: Props) {
  const versionLabel = config.versionId || config.id || "billing-config";

  return (
    <ConfigSectionCard
      helpId="billing.snapshots"
      title="Configuration Metadata"
      description="Version tracking and optional advanced JSON editing"
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`Version: ${versionLabel}`} size="small" color="primary" variant="outlined" />
        {config.updated_at && (
          <Chip
            label={`Updated: ${new Date(config.updated_at).toLocaleString()}`}
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Stack direction="row" alignItems="center" gap={1}>
        <FormControlLabel
          control={
            <Switch checked={showAdvanced} onChange={(e) => onToggleAdvanced(e.target.checked)} />
          }
          label="Advanced JSON edit"
        />
        <Tooltip title="Toggle direct editing of the raw JSON configuration payload." arrow>
          <Box sx={{ color: "text.secondary", cursor: "help" }}>
            <HelpCircle size={16} />
          </Box>
        </Tooltip>
      </Stack>

      {showAdvanced && (
        <Box mt={2}>
          <TextField
            label="Raw Config JSON"
            multiline
            minRows={8}
            fullWidth
            value={rawJson}
            onChange={(e) => onRawJsonChange(e.target.value)}
            error={Boolean(jsonError)}
            helperText={jsonError || "Edit with caution — invalid JSON will block saving"}
            sx={{ fontFamily: "monospace" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                  <Tooltip title="Directly inspect or modify the full underlying JSON configuration." arrow>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                      <HelpCircle size={16} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {!showAdvanced && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Structured editors above are the recommended way to update billing settings.
        </Typography>
      )}
    </ConfigSectionCard>
  );
}
