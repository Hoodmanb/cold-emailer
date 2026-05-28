"use client";

import React from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";

export default function AuthInitializingScreen({ label = "Loading session..." }) {
  return (
    <Stack alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
      <CircularProgress size={36} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
