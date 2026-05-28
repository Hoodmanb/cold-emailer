"use client";

import React, { useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Box,
} from "@mui/material";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
  required?: number;
  balance?: number;
}

export default function InsufficientCreditsModal({
  open,
  onClose,
  required,
  balance,
}: InsufficientCreditsModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AlertTriangle size={20} color="#f59e0b" />
        Insufficient Credits
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            You don&apos;t have enough credits for this AI operation.
          </Typography>
          {(required !== undefined || balance !== undefined) && (
            <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
              {balance !== undefined && (
                <Typography variant="body2">Current balance: <strong>{balance}</strong> credits</Typography>
              )}
              {required !== undefined && (
                <Typography variant="body2">Required: <strong>{required}</strong> credits</Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            Purchase a credit pack or switch to the Gateway plan with your own API key.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CreditCard size={16} />}
          onClick={() => {
            onClose();
            router.push("/pricing");
          }}
        >
          View Pricing
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function useInsufficientCreditsHandler() {
  const [state, setState] = React.useState<{ open: boolean; required?: number; balance?: number }>({
    open: false,
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setState({
        open: true,
        required: detail.required,
        balance: detail.balance,
      });
    };
    window.addEventListener("billing:insufficient-credits", handler);
    return () => window.removeEventListener("billing:insufficient-credits", handler);
  }, []);

  return {
    modalProps: {
      ...state,
      onClose: () => setState((s) => ({ ...s, open: false })),
    },
    Modal: InsufficientCreditsModal,
  };
}
