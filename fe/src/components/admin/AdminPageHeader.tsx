"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import type { AdminHelpId } from "@/components/admin/adminHelpContent";

type Props = {
  title: string;
  description?: string;
  helpId?: AdminHelpId;
  mb?: number;
};

export default function AdminPageHeader({ title, description, helpId, mb = 3 }: Props) {
  return (
    <Stack spacing={1} mb={mb}>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Typography variant="h4" fontWeight={800}>
          {title}
        </Typography>
        {helpId && <AdminHelpTip helpId={helpId} size={18} placement="right" />}
      </Stack>
      {description && (
        <Typography color="text.secondary">{description}</Typography>
      )}
    </Stack>
  );
}
