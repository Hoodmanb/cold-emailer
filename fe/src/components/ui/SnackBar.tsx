"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Alert from "@mui/material/Alert";
import { snackbarVariants } from "@/motion/variants";

interface SnackParams {
  open: boolean;
  text: string;
  state: "success" | "error" | "warning" | "info";
  onClose?: () => void;
}

export default function CustomizedSnackbars({
  open,
  text,
  state,
  onClose,
}: SnackParams) {
  // Auto-close after 3 seconds
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="snackbar"
          variants={snackbarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            minWidth: 280,
            maxWidth: 420,
          }}
        >
          <Alert
            onClose={onClose}
            severity={state}
            variant="filled"
            sx={{
              width: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              borderRadius: "10px",
              fontSize: "0.875rem",
            }}
          >
            {text}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
