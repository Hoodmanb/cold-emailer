"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5", // Indigo
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3b82f6", // Vibrant blue
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff", // Soft gray
      paper: "#ffffff",   // White surface
    },
    text: {
      primary: "#111827",
      secondary: "#4b5563",
    },
    divider: "rgba(0, 0, 0, 0.08)",
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    action: {
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
    }
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    h1: { fontWeight: 800, color: "#111827" },
    h2: { fontWeight: 800, color: "#111827" },
    h3: { fontWeight: 700, color: "#111827" },
    h4: { fontWeight: 700, color: "#111827" },
    h5: { fontWeight: 700, color: "#111827" },
    h6: { fontWeight: 600, color: "#111827" },
    body1: { color: "#374151" },
    body2: { color: "#4b5563" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // backgroundColor: "#f3f4f6",
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
        },
        containedPrimary: {
          "&:hover": {
            boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.39)",
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: "4px", fontWeight: 600 },
      },
    },
  },
});

export default theme;
