"use client";
import Drawer from "@/components/layout/AppBar";
import React from "react";
import { ThemeProvider, CssBaseline, useTheme } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Drawer>{children}</Drawer>
    </ThemeProvider>
  );
}
