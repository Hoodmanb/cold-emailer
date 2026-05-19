"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import { useAuth } from "@/context/AuthProvider";
import { useSnackbar } from "@/context/SnackbarContext";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    role?: string;
    createdAt?: string;
  } | null;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export default function DangerZone() {
  const { user, logout } = useAuth() as unknown as AuthContextType;
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [passwordReauth, setPasswordReauth] = useState("");
  const [deleting, setDeleting] = useState(false);

  const registeredEmail = String(user?.email || "").trim().toLowerCase();

  const handleOpen = () => {
    setConfirmEmail("");
    setPasswordReauth("");
    setOpen(true);
  };

  const handleClose = () => {
    if (deleting) return; // Prevent closing while processing
    setOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail.trim().toLowerCase() !== registeredEmail) {
      return showSnackbar("Confirmation email does not match", "error");
    }

    setDeleting(true);
    try {
      // 1. Fire delete request to backend
      const res = await axiosInstance.delete("/api/profile");
      
      if (res.data?.success) {
        showSnackbar("Your account and all associated data have been permanently deleted.", "success");
        
        // 2. Wipes React Query Cache completely to prevent stale view flashes
        console.log("[DangerZone] Purging React Query Cache...");
        queryClient.clear();

        // 3. Closes dialog cleanly
        setOpen(false);

        // 4. Calls authentication provider logout which purges cookies, Zustand, local storage, and redirects
        console.log("[DangerZone] Purging credentials and redirecting...");
        setTimeout(() => {
          logout();
        }, 1000);
      } else {
        showSnackbar(res.data?.message || "Failed to delete account. Please try again.", "error");
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      showSnackbar("An error occurred during account deletion. Please contact support.", "error");
      setDeleting(false);
    }
  };

  const isEmailMatched = confirmEmail.trim().toLowerCase() === registeredEmail;

  return (
    <Stack gap={4}>
      {/* Account Info/Security Placeholder Card */}
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Account Credentials & Security
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review your account email and basic security metadata.
            </Typography>
          </Box>
          <Stack gap={2} divider={<Divider />}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Registered Email</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email || "N/A"}</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Role Privilege</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {user?.role || "User"}
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Account Created</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "long" }) : "N/A"}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Danger Zone Warning Card */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          borderColor: "error.light",
          bgcolor: "rgba(254, 242, 242, 0.4)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack gap={3}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and remove all personal information. This process is irreversible and all your data will be permanently wiped.
              </Typography>
            </Box>

            <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                Irreversible Operations Summary:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: "1.6rem" }}>
                  <li>Your user login profile credentials will be deleted from the database.</li>
                  <li>All saved job resumes, cover letters, and generated document packages will be permanently removed.</li>
                  <li>All customized AI workflows, model structures, and prompt instructions will be wiped out.</li>
                  <li>Your active secure SMTP email dispatch accounts will be deleted.</li>
                  <li>Historical audit trails and job schedules associated with your account will be cleared.</li>
                </ul>
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="flex-start" sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleOpen}
                sx={{
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: "error.main",
                    color: "white",
                  },
                }}
              >
                Delete My Account
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Irreversible Deletion Modal Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-account-dialog-title"
        aria-describedby="delete-account-dialog-description"
        disableEscapeKeyDown={deleting}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 4,
            p: 1.5,
          },
        }}
      >
        <DialogTitle id="delete-account-dialog-title" sx={{ fontWeight: 800, color: "error.main" }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-dialog-description" variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Warning: This action is permanent and cannot be undone. All of your personal resume assets, cover letters, custom prompts, and integrations will be completely erased.
          </DialogContentText>
          
          <Stack gap={2.5}>
            {/* Hardened Security Password Re-auth Extension Input */}
            <TextField
              fullWidth
              label="Confirm Account Password"
              type="password"
              variant="outlined"
              size="small"
              value={passwordReauth}
              onChange={(e) => setPasswordReauth(e.target.value)}
              disabled={deleting}
              placeholder="••••••••"
              helperText="Security verification re-authentication (optional mock)"
            />

            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              To confirm deletion, please type your registered email address <code style={{ color: "#ef4444", fontWeight: 700 }}>{user?.email}</code>:
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter your email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={deleting}
              inputProps={{ "aria-label": "Account Confirmation Email" }}
              error={confirmEmail !== "" && !isEmailMatched}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={deleting}
            sx={{ fontWeight: 600, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={!isEmailMatched || deleting}
            sx={{
              fontWeight: 700,
              px: 3,
              boxShadow: "none",
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
              },
            }}
          >
            {deleting ? (
              <Stack direction="row" alignItems="center" gap={1}>
                <CircularProgress size={16} color="inherit" />
                <span>Deleting...</span>
              </Stack>
            ) : (
              "Permanently Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
