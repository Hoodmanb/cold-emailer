"use client";

import React from "react";
import { Stack, Box, Chip, Typography, Divider } from "@mui/material";

interface KeywordGridProps {
  matched: string[];
  missing: string[];
  title?: string;
}

export default function KeywordGrid({ matched, missing, title = "Keyword Analysis" }: KeywordGridProps) {
  return (
    <Stack gap={2}>
      {title && (
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      )}
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="caption" fontWeight={700} color="success.main">
            ✅ MATCHED ({matched.length})
          </Typography>
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {matched.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No matches found
            </Typography>
          ) : (
            matched.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: "0.7rem", fontWeight: 600 }}
              />
            ))
          )}
        </Box>
      </Stack>

      <Divider />

      <Stack gap={1}>
        <Typography variant="caption" fontWeight={700} color="error.main">
          ❌ MISSING ({missing.length})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {missing.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              All keywords covered!
            </Typography>
          ) : (
            missing.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: "0.7rem", fontWeight: 600 }}
              />
            ))
          )}
        </Box>
      </Stack>
    </Stack>
  );
}
