"use client";

import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import lightTheme from "../styles/theme";

import { SnackbarProvider } from "../context/SnackbarContext";
import { ProductivityProvider } from "../context/ProductivityContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () => {
      console.log("[Providers] Creating new QueryClient instance");
      return new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      });
    }
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <SnackbarProvider>
          <ProductivityProvider>
            {children}
          </ProductivityProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
