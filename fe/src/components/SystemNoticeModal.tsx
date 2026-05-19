"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { Info as InfoIcon } from "lucide-react";

export default function SystemNoticeModal() {
  // 1. Strict Gate Check: compile-time & runtime environment check
  // Do NOT mount logic or trigger any localStorage checks outside of production
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return null;
  }

  return <SystemNoticeModalComponent />;
}

function SystemNoticeModalComponent() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const dismissed = localStorage.getItem("system_notice_dismissed") === "true";
      if (dismissed) {
        return;
      }

      const seenAtStr = localStorage.getItem("system_notice_seen_at");
      const seenAt = seenAtStr ? parseInt(seenAtStr, 10) : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes cooldown

      // Show if never seen before, or seen more than 5 minutes ago
      if (!seenAtStr || now - seenAt > fiveMinutes) {
        setOpen(true);
        localStorage.setItem("system_notice_seen_at", String(now));
      }
    } catch (e) {
      console.warn("[SystemNoticeModal] LocalStorage access blocked or failed:", e);
    }
  }, []);

  const handleGotIt = () => {
    try {
      localStorage.setItem("system_notice_seen_at", String(Date.now()));
    } catch (e) {
      console.warn(e);
    }
    setOpen(false);
  };

  const handleDontShowAgain = () => {
    try {
      localStorage.setItem("system_notice_dismissed", "true");
    } catch (e) {
      console.warn(e);
    }
    setOpen(false);
  };

  // Prevent server-side or early client-side hydration mismatches
  if (!mounted) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleGotIt}
      aria-labelledby="system-notice-dialog-title"
      aria-describedby="system-notice-dialog-description"
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 4,
          p: 2,
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        },
      }}
    >
      <DialogTitle id="system-notice-dialog-title" sx={{ p: 1, pb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(25, 118, 210, 0.1)",
              color: "primary.main",
              borderRadius: "50%",
              width: 36,
              height: 36,
              p: 0.75,
            }}
          >
            <InfoIcon size={20} />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            System Demo Notice
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent id="system-notice-dialog-description" sx={{ px: 1, py: 1.5 }}>
        <Stack gap={2}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: "1.6rem" }}>
            This application is running in a <strong>demo / production-limited environment</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: "1.6rem" }}>
            Any data, settings, or credentials you create or store here are temporarily saved and <strong>may be automatically purged after 24 hours</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: "1.6rem" }}>
            Please do not use this space to save business-critical configurations or permanent personal files.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 1, pt: 2, pb: 0, justifyContent: "space-between", gap: 1 }}>
        <Button
          onClick={handleDontShowAgain}
          variant="text"
          color="inherit"
          sx={{
            fontSize: "0.8rem",
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 500,
            "&:hover": {
              textDecoration: "underline",
              bgcolor: "transparent",
            },
          }}
        >
          Don't show again
        </Button>
        <Button
          onClick={handleGotIt}
          variant="contained"
          color="primary"
          sx={{
            fontWeight: 700,
            px: 3,
            borderRadius: 2.5,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
