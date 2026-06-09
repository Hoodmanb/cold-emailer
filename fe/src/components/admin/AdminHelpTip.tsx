"use client";

import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Info } from "lucide-react";
import { AdminHelpId, getAdminHelp } from "@/components/admin/adminHelpContent";

type Props = {
  helpId: AdminHelpId;
  size?: number;
  placement?: "top" | "bottom" | "left" | "right";
};

export default function AdminHelpTip({ helpId, size = 16, placement = "top" }: Props) {
  const help = getAdminHelp(helpId);

  return (
    <Tooltip
      arrow
      placement={placement}
      describeChild
      slotProps={{
        tooltip: {
          sx: { maxWidth: 340, p: 1.5 },
        },
      }}
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {help.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            {help.description}
          </Typography>
          {help.details && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.85 }}>
              {help.details}
            </Typography>
          )}
        </Box>
      }
    >
      <IconButton
        size="small"
        aria-label={`Help: ${help.title}`}
        sx={{
          p: 0.25,
          color: "text.secondary",
          "&:hover": { color: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <Info size={size} />
      </IconButton>
    </Tooltip>
  );
}
