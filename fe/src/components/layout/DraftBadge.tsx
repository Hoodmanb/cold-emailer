"use client";

import React from "react";
import { Chip, Stack, Typography, Tooltip } from "@mui/material";

interface DraftBadgeProps {
  status: "draft" | "approved" | "sent" | "failed" | string;
  size?: "small" | "medium";
}

const STATUS_CONFIG: Record<string, { label: string; color: "warning" | "success" | "info" | "error" | "default"; tooltip: string }> = {
  draft: {
    label: "Draft",
    color: "warning",
    tooltip: "This content is a draft. Review and approve before using.",
  },
  approved: {
    label: "Approved",
    color: "success",
    tooltip: "Approved and ready to use or send.",
  },
  sent: {
    label: "Sent",
    color: "info",
    tooltip: "This email has been sent.",
  },
  failed: {
    label: "Failed",
    color: "error",
    tooltip: "Send failed. Check your email configuration.",
  },
};

export default function DraftBadge({ status, size = "small" }: DraftBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: "default", tooltip: "" };

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip
        label={config.label}
        color={config.color as any}
        size={size}
        variant={status === "draft" ? "outlined" : "filled"}
        sx={{ fontWeight: 700, cursor: "help" }}
      />
    </Tooltip>
  );
}
