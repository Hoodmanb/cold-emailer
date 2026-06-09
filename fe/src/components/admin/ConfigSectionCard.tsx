"use client";

import React from "react";
import { Paper, Typography, Box, Stack } from "@mui/material";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import type { AdminHelpId } from "@/components/admin/adminHelpContent";

type ConfigSectionCardProps = {
  title: string;
  description?: string;
  helpId?: AdminHelpId;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function ConfigSectionCard({
  title,
  description,
  helpId,
  action,
  children,
}: ConfigSectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={2} gap={1}>
        <Box>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
            {helpId && <AdminHelpTip helpId={helpId} />}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}
