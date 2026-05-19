"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import CustomizedSnackbars from "@/components/ui/SnackBar";

export type SnackbarType = "success" | "error" | "warning" | "info";

interface SnackbarContextProps {
  showSnackbar: (message: string, type: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextProps | undefined>(
  undefined
);

export const useSnackbar = (): SnackbarContextProps => {
  const context = useContext(SnackbarContext);
  if (!context)
    throw new Error("useSnackbar must be used within SnackbarProvider");
  return context;
};

// Hook alias for standard error system requirement
export const useToast = useSnackbar;

// Static toaster handler for non-React context calls (e.g. Axios interceptors)
let globalShowSnackbar: ((message: string, type: SnackbarType) => void) | null = null;

export const showToast = (message: string, type: SnackbarType) => {
  if (globalShowSnackbar) {
    globalShowSnackbar(message, type);
  } else {
    console.warn("[Toast] SnackbarProvider not initialized yet.", { message, type });
  }
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("info");

  const showSnackbar = (msg: string, severity: SnackbarType) => {
    setMessage(msg);
    setType(severity);
    setOpen(true);
  };

  useEffect(() => {
    globalShowSnackbar = showSnackbar;
    return () => {
      globalShowSnackbar = null;
    };
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <CustomizedSnackbars
        open={open}
        text={message}
        state={type}
        onClose={() => setOpen(false)}
      />
    </SnackbarContext.Provider>
  );
};
