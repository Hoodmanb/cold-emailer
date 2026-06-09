"use client";

import React from "react";
import { Chip, Stack } from "@mui/material";
import type { DocumentTemplate } from "@/types/documentTemplate";

import TemplateStatusBadge from "@/components/template/TemplateStatusBadge";

type BadgeTemplate = Pick<
  DocumentTemplate,
  "templateKind" | "approvalStatus" | "featured" | "isPublic"
>;

const KIND_LABELS: Record<string, string> = {
  ai: "AI Template",
  placeholder: "Placeholder Template",
  hybrid: "Hybrid Template",
  community: "Community Template",
};

const KIND_EMOJI: Record<string, string> = {
  ai: "🤖",
  placeholder: "📝",
  hybrid: "⚡",
  community: "🌍",
};

export default function TemplateBadges({ template }: { template: BadgeTemplate }) {
  const kind = template.templateKind || "ai";

  return (
    <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
      <Chip
        size="small"
        label={`${KIND_EMOJI[kind] || "📄"} ${KIND_LABELS[kind] || kind}`}
        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
      />
      {template.isPublic && (
        <Chip size="small" color="info" label="🌍 Community Template" sx={{ fontSize: "0.7rem" }} />
      )}
      {template.approvalStatus && (
        <TemplateStatusBadge status={template.approvalStatus} />
      )}
      {template.featured && (
        <Chip size="small" color="secondary" label="⭐ Featured" sx={{ fontSize: "0.7rem" }} />
      )}
    </Stack>
  );
}
