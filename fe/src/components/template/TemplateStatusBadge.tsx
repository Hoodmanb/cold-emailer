// TemplateStatusBadge.tsx
"use client";

import React from "react";
import { Chip, Tooltip } from "@mui/material";
import type { ApprovalStatus } from "@/types/documentTemplate";

type Props = { status: ApprovalStatus | undefined };

const STATUS_MAP: Partial<Record<ApprovalStatus, { color: "success" | "warning" | "error" | "default"; label: string; tooltip: string }>> = {
  approved: { color: "success", label: "Approved", tooltip: "Template has been reviewed and is publicly visible." },
  published: { color: "success", label: "Published", tooltip: "Template is published and available." },
  pending_approval: { color: "warning", label: "Pending", tooltip: "Awaiting admin approval." },
  submitted: { color: "warning", label: "Submitted", tooltip: "Submitted for review." },
  rejected: { color: "error", label: "Rejected", tooltip: "Template was declined; author can edit." },
  draft: { color: "default", label: "Draft", tooltip: "Only visible to the creator." },
  archived: { color: "default", label: "Archived", tooltip: "Template is archived." },
};

export default function TemplateStatusBadge({ status }: Props) {
  if (!status) return null;
  const info = STATUS_MAP[status];
  if (!info) return null;
  return (
    <Tooltip title={info.tooltip} arrow>
      <Chip size="small" color={info.color} label={info.label} sx={{ fontSize: "0.7rem" }} />
    </Tooltip>
  );
}
