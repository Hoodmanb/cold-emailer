"use client";

import React from "react";
import { IconButton, Stack, SxProps, TextField, Theme } from "@mui/material";
import { Trash2 } from "lucide-react";

type DynamicInputRowProps = {
  value: string;
  label: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  disabledDelete?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
};

export function DynamicInputRow({
  value,
  label,
  onChange,
  onDelete,
  disabledDelete = false,
  placeholder,
  sx,
}: DynamicInputRowProps) {
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={sx}>
      <TextField
        label={label}
        size="small"
        fullWidth
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <IconButton
        aria-label={`Delete ${label}`}
        color="error"
        onClick={onDelete}
        disabled={disabledDelete}
        sx={{
          alignSelf: "center",
          transition: "background-color 0.2s ease, transform 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(211, 47, 47, 0.12)",
            transform: "scale(1.03)",
          },
        }}
      >
        <Trash2 size={16} />
      </IconButton>
    </Stack>
  );
}
