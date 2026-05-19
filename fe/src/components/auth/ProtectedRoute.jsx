"use client";

import React from "react";
import { CircularProgress, Stack } from "@mui/material";
import { useAuth } from "@/context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading || !isAuthenticated) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress />
      </Stack>
    );
  }
  return children;
}
