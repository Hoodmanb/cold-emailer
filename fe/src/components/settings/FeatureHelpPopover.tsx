"use client";

import React, { useState } from "react";
import {
  IconButton, Popover, Box, Typography, Stack, Chip, Divider,
} from "@mui/material";
import { HelpCircle } from "lucide-react";
import { getFeatureHelp } from "./featureHelpContent";

interface FeatureHelpPopoverProps {
  featureId: string;
  size?: number;
  label?: string;
}

export default function FeatureHelpPopover({ featureId, size = 16, label }: FeatureHelpPopoverProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const help = getFeatureHelp(featureId);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ p: 0.25, color: "text.secondary", "&:hover": { color: "primary.main" } }}
        aria-label={`Help for ${help.title}`}
      >
        <HelpCircle size={size} />
      </IconButton>
      {label && (
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {label}
        </Typography>
      )}
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { borderRadius: 3, maxWidth: 380, p: 2.5 } } }}
      >
        <Stack gap={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>{help.title}</Typography>
          <Typography variant="body2" color="text.secondary">{help.description}</Typography>

          <Divider />

          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Affects Workflows
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
              {help.workflows.map((w) => (
                <Chip key={w} label={w} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 22 }} />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Example Use Cases
            </Typography>
            <Stack gap={0.25} sx={{ mt: 0.5 }}>
              {help.examples.map((ex) => (
                <Typography key={ex} variant="caption" color="text.secondary">• {ex}</Typography>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700} color="primary.main">Prompt Impact</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
              {help.promptImpact}
            </Typography>
          </Box>
        </Stack>
      </Popover>
    </>
  );
}
