"use client";

import React from "react";
import { Box, Stack, Slider, Typography, Chip } from "@mui/material";
import type { TailoringLevel } from "@/types";

const LEVELS: { value: TailoringLevel; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "Only explicit profile data" },
  { value: "balanced", label: "Balanced", description: "Moderate ATS optimization" },
  { value: "aggressive", label: "Aggressive", description: "Strong keyword alignment" },
];

interface TailoringSliderProps {
  value: TailoringLevel;
  onChange: (level: TailoringLevel) => void;
}

export default function TailoringSlider({ value, onChange }: TailoringSliderProps) {
  const index = LEVELS.findIndex((l) => l.value === value);
  const active = LEVELS[index >= 0 ? index : 1];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          AI Tailoring
        </Typography>
        <Chip label={active.label} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
      </Stack>
      <Slider
        value={index >= 0 ? index : 1}
        min={0}
        max={2}
        step={1}
        marks={LEVELS.map((l, i) => ({ value: i, label: i === 1 ? "Balanced" : "" }))}
        onChange={(_, v) => onChange(LEVELS[v as number].value)}
        sx={{ mt: 1, mb: 0.5 }}
      />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Conservative</Typography>
        <Typography variant="caption" color="text.secondary">Aggressive</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {active.description}
      </Typography>
    </Box>
  );
}
