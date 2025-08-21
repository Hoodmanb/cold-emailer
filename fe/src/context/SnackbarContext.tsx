"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import CustomizedSnackbars from "@/components/ui/SnackBar";

type SnackbarType = "success" | "error" | "warning" | "info";

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

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("info");

  const showSnackbar = (msg: string, severity: SnackbarType) => {
    setMessage(msg);
    setType(severity);
    setOpen(true);
  };

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
