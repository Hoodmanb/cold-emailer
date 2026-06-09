"use client";

import React from "react";
import { Paper, Typography, Box, Skeleton, Stack } from "@mui/material";
import { LucideIcon } from "lucide-react";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import type { AdminHelpId } from "@/components/admin/adminHelpContent";

type StatCardProps = {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color?: string;
  loading?: boolean;
  helpId?: AdminHelpId;
};

export default function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = "primary.main",
  loading,
  helpId,
}: StatCardProps) {
  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Skeleton width="60%" />
        <Skeleton width="40%" height={36} sx={{ mt: 1 }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Stack direction="row" alignItems="center" gap={0.25}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            {helpId && <AdminHelpTip helpId={helpId} size={14} />}
          </Stack>
          <Typography variant="h5" fontWeight={800} mt={0.5}>
            {value}
          </Typography>
          {subValue && (
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {subValue}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, p: 1, borderRadius: 2, bgcolor: "action.hover" }}>
          <Icon size={22} />
        </Box>
      </Box>
    </Paper>
  );
}
