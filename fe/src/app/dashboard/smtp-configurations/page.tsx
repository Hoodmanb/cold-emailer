"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Mail, Edit, Trash2, Plus, ChevronDown, Zap, Send } from "lucide-react";
import { useFetchSmtps, SmtpConfig, VerificationMode } from "@/hooks/queryHooks/smtp";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

function SmtpStatusChip({ status }: { status: string }) {
  const chip =
    status === "verified" ? (
      <Chip label="Verified" color="success" size="small" />
    ) : status === "failed" ? (
      <Chip label="Failed" color="error" size="small" />
    ) : (
      <Chip label="Pending" color="warning" size="small" />
    );
  return (
    <Box sx={{ display: "inline-flex", transition: "opacity 0.2s ease" }}>
      {chip}
    </Box>
  );
}

function formatLastVerified(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function modeLabel(mode: string | null | undefined) {
  if (mode === "quick") return "Quick";
  if (mode === "deep") return "Deep";
  return null;
}

function VerifySplitButton({
  smtp,
  busy,
  onVerify,
}: {
  smtp: SmtpConfig;
  busy: boolean;
  onVerify: (mode: VerificationMode) => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchor);

  return (
    <>
      <Button
        variant="outlined"
        color={smtp.status === "verified" ? "success" : "primary"}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={busy}
        endIcon={
          busy ? (
            <CircularProgress color="inherit" size={18} />
          ) : (
            <ChevronDown size={18} aria-hidden />
          )
        }
        sx={{
          minHeight: 44,
          minWidth: { xs: "100%", sm: 120 },
          transition: "opacity 0.2s ease, transform 0.15s ease",
          "&:active": { transform: "scale(0.98)" },
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen ? "true" : undefined}
      >
        Verify
      </Button>
      <Menu
        anchorEl={anchor}
        open={menuOpen}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 220,
              mt: 0.5,
            },
          },
        }}
      >
        <MenuItem
          dense={false}
          onClick={() => {
            onVerify("quick");
            setAnchor(null);
          }}
          sx={{ minHeight: 48, py: 1.25 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Zap size={20} strokeWidth={2} />
          </ListItemIcon>
          <ListItemText
            primary="Quick verify"
            secondary="Connection check only"
            primaryTypographyProps={{ fontWeight: 600 }}
            secondaryTypographyProps={{ variant: "caption" }}
          />
        </MenuItem>
        <MenuItem
          dense={false}
          onClick={() => {
            onVerify("deep");
            setAnchor(null);
          }}
          sx={{ minHeight: 48, py: 1.25 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Send size={20} strokeWidth={2} />
          </ListItemIcon>
          <ListItemText
            primary="Deep verify"
            secondary="Send test email to yourself"
            primaryTypographyProps={{ fontWeight: 600 }}
            secondaryTypographyProps={{ variant: "caption" }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

export default function SmtpConfigurationsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));

  const { smtps, loading, error, refetch, patchSmtp, clearError } = useFetchSmtps();
  const { showSnackbar } = useSnackbar();

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    host: "",
    port: 465,
    secure: true,
    appPassword: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  const showSkeleton = loading && smtps.length === 0;

  const applyVerifyResponse = (id: string, data: SmtpConfig | undefined) => {
    if (data) patchSmtp(id, data);
  };

  const handleVerify = async (id: string, mode: VerificationMode) => {
    setVerifyingId(id);
    try {
      const res = await axiosInstance.post(`/api/smtp/verify/${id}`, { mode });
      applyVerifyResponse(id, res.data?.data as SmtpConfig | undefined);
      if (res.data?.success) {
        showSnackbar(
          mode === "quick" ? "Quick verify succeeded." : "Deep verify succeeded (test email sent).",
          "success"
        );
      } else {
        showSnackbar(res.data?.message || "Verification failed", "warning");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { data?: SmtpConfig; message?: string; error?: string } } };
      const payload = ax.response?.data;
      applyVerifyResponse(id, payload?.data);
      showSnackbar(
        payload?.message || payload?.error || "Verification failed",
        "error"
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    try {
      const res = await axiosInstance.delete(`/api/smtp/${id}`);
      if (res.data?.success || res.status === 200) {
        showSnackbar("SMTP deleted", "success");
        refetch();
      } else {
        showSnackbar(res.data?.message || "Failed to delete", "error");
      }
    } catch {
      showSnackbar("Failed to delete", "error");
    }
  };

  const openModal = (smtp?: SmtpConfig) => {
    if (smtp) {
      setEditingId(smtp.id);
      setForm({
        email: smtp.email,
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        appPassword: "",
        isDefault: smtp.isDefault,
      });
    } else {
      setEditingId(null);
      setForm({
        email: "",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        appPassword: "",
        isDefault: false,
      });
    }
    setModalOpen(true);
  };

  const handlePresetChange = (preset: string) => {
    if (preset === "gmail") {
      setForm((prev) => ({ ...prev, host: "smtp.gmail.com", port: 465, secure: true }));
    } else if (preset === "outlook") {
      setForm((prev) => ({ ...prev, host: "smtp-mail.outlook.com", port: 587, secure: false }));
    } else {
      setForm((prev) => ({ ...prev, host: "", port: 587, secure: false }));
    }
  };

  const handleSave = async () => {
    if (!form.email || !form.host || !form.port) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    if (!editingId && !form.appPassword) {
      showSnackbar("App Password is required for new configs", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId && !payload.appPassword) {
        delete (payload as Record<string, unknown>).appPassword;
      }

      let res;
      if (editingId) {
        res = await axiosInstance.put(`/api/smtp/${editingId}`, payload);
      } else {
        res = await axiosInstance.post("/api/smtp", payload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        showSnackbar("SMTP Config saved successfully", "success");
        setModalOpen(false);
        refetch();
      } else {
        showSnackbar(res.data?.message || "Failed to save", "error");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showSnackbar(ax?.response?.data?.message || "Failed to save SMTP", "error");
    } finally {
      setSaving(false);
    }
  };

  const cardSkeleton = (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
          <Card variant="outlined" sx={{ borderRadius: 4, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton width={80} height={24} />
              </Stack>
              <Skeleton width="80%" height={28} sx={{ mb: 1 }} />
              <Skeleton width="60%" height={20} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const emptyState = (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Paper
        elevation={0}
        sx={{
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: 6,
          px: { xs: 3, sm: 6 },
          py: { xs: 6, sm: 10 },
          bgcolor: "action.hover",
          maxWidth: 600,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "primary.lighter",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3
          }}
        >
          <Mail size={40} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          No SMTP accounts configured
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
          Connect your mailboxes to start sending high-deliverability cold emails and run automated verifications.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Plus size={20} />}
          onClick={() => openModal()}
          sx={{
            minHeight: 52,
            px: 4,
            borderRadius: 3,
            fontWeight: 800,
            boxShadow: theme.shadows[4]
          }}
        >
          Connect New SMTP
        </Button>
      </Paper>
    </Box>
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "lg",
        mx: "auto",
        px: { xs: 0, sm: 0 },
        overflowX: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Mail size={28} color="#3b82f6" aria-hidden />
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2.125rem" },
            }}
          >
            SMTP Configurations
          </Typography>
        </Stack>
        {smtps.length !== 0 && <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => openModal()}
          sx={{ fontWeight: 700, minHeight: 44, width: { xs: "100%", sm: "auto" } }}
        >
          Add SMTP
        </Button>}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      ) : null}

      {showSkeleton ? cardSkeleton : null}

      {!showSkeleton && smtps.length === 0 ? emptyState : null}

      {!showSkeleton && smtps.length > 0 ? (
        <Grid container spacing={3}>
          {smtps.map((smtp) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={smtp.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: theme.shadows[4],
                    transform: "translateY(-4px)"
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: "primary.lighter",
                        color: "primary.main",
                        display: "flex"
                      }}
                    >
                      <Mail size={24} />
                    </Box>
                    <SmtpStatusChip status={smtp.status} />
                  </Stack>

                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                      wordBreak: "break-all",
                      mb: 1,
                      lineHeight: 1.2
                    }}
                  >
                    {smtp.email}
                  </Typography>

                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
                    {smtp.isDefault && (
                      <Chip
                        label="Primary Account"
                        size="small"
                        sx={{
                          bgcolor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: 0.5
                        }}
                      />
                    )}
                    <Chip
                      label={`${smtp.host}:${smtp.port}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        borderColor: "divider"
                      }}
                    />
                  </Stack>

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover", mb: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        LAST VERIFIED
                      </Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {smtp.lastVerifiedAt ? formatLastVerified(smtp.lastVerifiedAt) : "Never"}
                      </Typography>
                    </Stack>
                    {modeLabel(smtp.lastVerificationMode) && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: "right", fontStyle: "italic" }}>
                        via {modeLabel(smtp.lastVerificationMode)} verify
                      </Typography>
                    )}
                  </Box>

                  <Stack spacing={1.5}>
                    <VerifySplitButton
                      smtp={smtp}
                      busy={verifyingId === smtp.id}
                      onVerify={(mode) => handleVerify(smtp.id, mode)}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Edit size={16} />}
                        onClick={() => openModal(smtp)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          borderColor: "divider",
                          color: "text.primary"
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        aria-label="Delete SMTP"
                        onClick={() => handleDelete(smtp.id)}
                        color="error"
                        sx={{
                          borderRadius: 2,
                          bgcolor: "error.lighter",
                          border: "1px solid",
                          borderColor: "error.lighter",
                          "&:hover": { bgcolor: "error.light", color: "white" }
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={fullScreenDialog}
        TransitionProps={{ timeout: theme.transitions.duration.shortest }}
      >
        <DialogTitle fontWeight={700}>
          {editingId ? "Edit SMTP" : "Add SMTP Configuration"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={3} sx={{ pt: fullScreenDialog ? 1 : 0 }}>
            {!editingId ? (
              <FormControl fullWidth size="small">
                <InputLabel>Preset Configuration</InputLabel>
                <Select
                  defaultValue="gmail"
                  label="Preset Configuration"
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="outlook">Outlook / Office 365</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            ) : null}

            <TextField
              label="Email Address"
              size="small"
              fullWidth
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="SMTP Host"
                  size="small"
                  fullWidth
                  required
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Port"
                  type="number"
                  size="small"
                  fullWidth
                  required
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value, 10) || 0 })}
                />
              </Grid>
            </Grid>

            <TextField
              label={
                editingId
                  ? "New App Password (Leave blank to keep current)"
                  : "App Password (16-char for Gmail)"
              }
              type="password"
              size="small"
              fullWidth
              required={!editingId}
              value={form.appPassword}
              onChange={(e) => setForm({ ...form, appPassword: e.target.value })}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={form.secure}
                    onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                    color="primary"
                  />
                }
                label="Use SSL/TLS (Secure)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    color="success"
                  />
                }
                label="Set as Default"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: 1 }}>
          <Button
            onClick={() => setModalOpen(false)}
            disabled={saving}
            fullWidth={fullScreenDialog}
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            fullWidth={fullScreenDialog}
            sx={{ minHeight: 44 }}
          >
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
