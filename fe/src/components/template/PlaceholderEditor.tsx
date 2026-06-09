"use client";

import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractPlaceholders(content: string): string[] {
  const found = new Set<string>();
  let match;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

export function PlaceholderPreview({ content }: { content: string }) {
  const placeholders = useMemo(() => extractPlaceholders(content), [content]);

  if (!placeholders.length) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Detected placeholders
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
        {placeholders.map((p) => (
          <Typography
            key={p}
            component="span"
            variant="caption"
            sx={{
              bgcolor: "#fef3c7",
              color: "#92400e",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            {`{{${p}}}`}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function PlaceholderHighlight({ value }: { value: string }) {
  const parts = useMemo(() => {
    const result: Array<{ text: string; isPlaceholder: boolean }> = [];
    let lastIndex = 0;
    let match;
    const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
    while ((match = regex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: value.slice(lastIndex, match.index), isPlaceholder: false });
      }
      result.push({ text: match[0], isPlaceholder: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < value.length) {
      result.push({ text: value.slice(lastIndex), isPlaceholder: false });
    }
    return result;
  }, [value]);

  if (!value.trim()) {
    return (
      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
        Preview will appear as you type placeholders
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "action.hover",
        fontFamily: "monospace",
        fontSize: "0.8rem",
        whiteSpace: "pre-wrap",
      }}
    >
      {parts.map((part, index) =>
        part.isPlaceholder ? (
          <Box
            key={`${part.text}-${index}`}
            component="span"
            sx={{ bgcolor: "#fef3c7", color: "#92400e", px: 0.5, borderRadius: 0.5 }}
          >
            {part.text}
          </Box>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </Box>
  );
}
