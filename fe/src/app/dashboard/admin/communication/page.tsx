"use client";

import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Mail,
  Send,
  Link as LinkIcon,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import { adminApi } from "@/lib/adminApi";
import { showToast } from "@/context/SnackbarContext";

interface SocialConfig {
  url?: string;
  email?: string;
  enabled: boolean;
}

interface CommSettings {
  whatsapp: SocialConfig;
  instagram: SocialConfig;
  twitter: SocialConfig;
  supportEmail: SocialConfig;
}

interface SmtpProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  secure: boolean;
  isActive: boolean;
}

export default function AdminCommunicationPage() {
  const qc = useQueryClient();
  const [tabValue, setTabValue] = useState(0);

  // Dialog state for adding/editing SMTP
  const [smtpDialogOpen, setSmtpDialogOpen] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState<SmtpProfile | null>(null);

  // SMTP form state
  const [smtpName, setSmtpName] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);

  // Testing SMTP connection loading state
  const [testingSmtpId, setTestingSmtpId] = useState<string | null>(null);

  // Load configuration and SMTP profiles
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "communication"],
    queryFn: () =>
      adminApi.get<{ settings: CommSettings; smtps: SmtpProfile[] }>(
        "/api/admin/communication"
      ),
  });

  // Social Settings Form State
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [twitterEnabled, setTwitterEnabled] = useState(false);
  const [supportEmailAddr, setSupportEmailAddr] = useState("");
  const [supportEmailEnabled, setSupportEmailEnabled] = useState(false);

  // Initialize social form once loaded
  React.useEffect(() => {
    if (data?.settings) {
      setWhatsappUrl(data.settings.whatsapp?.url || "");
      setWhatsappEnabled(data.settings.whatsapp?.enabled || false);
      setInstagramUrl(data.settings.instagram?.url || "");
      setInstagramEnabled(data.settings.instagram?.enabled || false);
      setTwitterUrl(data.settings.twitter?.url || "");
      setTwitterEnabled(data.settings.twitter?.enabled || false);
      setSupportEmailAddr(data.settings.supportEmail?.email || "");
      setSupportEmailEnabled(data.settings.supportEmail?.enabled || false);
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: (body: any) =>
      adminApi.put("/api/admin/communication/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communication"] });
      showToast("Communication channels updated successfully!", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to update settings", "error");
    },
  });

  const saveSmtpMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingSmtp) {
        return adminApi.put(`/api/admin/communication/smtp/${editingSmtp.id}`, body);
      } else {
        return adminApi.post("/api/admin/communication/smtp", body);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communication"] });
      setSmtpDialogOpen(false);
      showToast(
        editingSmtp ? "SMTP profile updated" : "SMTP profile created",
        "success"
      );
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to save SMTP profile", "error");
    },
  });

  const deleteSmtpMutation = useMutation({
    mutationFn: (id: string) =>
      adminApi.delete(`/api/admin/communication/smtp/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communication"] });
      showToast("SMTP profile deleted successfully", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to delete SMTP profile", "error");
    },
  });

  const setActiveSmtpMutation = useMutation({
    mutationFn: (id: string) =>
      adminApi.post(`/api/admin/communication/smtp/${id}/set-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communication"] });
      showToast("Active SMTP profile updated", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to set active SMTP", "error");
    },
  });

  const handleSaveSocials = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      whatsapp: { url: whatsappUrl.trim(), enabled: whatsappEnabled },
      instagram: { url: instagramUrl.trim(), enabled: instagramEnabled },
      twitter: { url: twitterUrl.trim(), enabled: twitterEnabled },
      supportEmail: { email: supportEmailAddr.trim().toLowerCase(), enabled: supportEmailEnabled },
    });
  };

  const handleOpenSmtpDialog = (smtp: SmtpProfile | null = null) => {
    setEditingSmtp(smtp);
    if (smtp) {
      setSmtpName(smtp.name);
      setSmtpHost(smtp.host);
      setSmtpPort(String(smtp.port));
      setSmtpUsername(smtp.username);
      setSmtpPassword(""); // Do not pre-fill passwords for safety
      setSmtpSecure(smtp.secure);
    } else {
      setSmtpName("");
      setSmtpHost("");
      setSmtpPort("587");
      setSmtpUsername("");
      setSmtpPassword("");
      setSmtpSecure(false);
    }
    setSmtpDialogOpen(true);
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpName.trim() || !smtpHost.trim() || !smtpPort.trim() || !smtpUsername.trim()) {
      showToast("Please fill in all required fields", "warning");
      return;
    }
    if (!editingSmtp && !smtpPassword) {
      showToast("Password is required for new SMTP profiles", "warning");
      return;
    }

    saveSmtpMutation.mutate({
      name: smtpName.trim(),
      host: smtpHost.trim(),
      port: Number(smtpPort),
      username: smtpUsername.trim(),
      secure: smtpSecure,
      ...(smtpPassword ? { password: smtpPassword } : {}),
    });
  };

  const handleTestConnection = async (id: string) => {
    setTestingSmtpId(id);
    try {
      const response: any = await adminApi.post(`/api/admin/communication/smtp/${id}/test`);
      showToast(response?.message || "SMTP connection verified successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Connection test failed", "error");
    } finally {
      setTestingSmtpId(null);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
        Failed to load communication settings.
      </Alert>
    );
  }

  return (
    <Box maxWidth={1100}>
      <AdminPageHeader
        helpId="billing.globalSettings"
        title="Communication Settings"
        description="Configure support social channels and SMTP profiles for system emails."
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Support Channels" />
          <Tab label="SMTP Management" />
        </Tabs>
      </Box>

      {/* Support Channels Tab */}
      {tabValue === 0 && (
        <Stack spacing={3}>
          <ConfigSectionCard
            title="Social Support Channels"
            description="Manage public links rendered on the landing page and throughout the user floating widget."
          >
            <Box component="form" onSubmit={handleSaveSocials}>
              <Grid container spacing={3}>
                {/* WhatsApp */}
                <Grid container sx={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} variant="subtitle2">
                          WhatsApp Business
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={whatsappEnabled}
                              onChange={(e) => setWhatsappEnabled(e.target.checked)}
                            />
                          }
                          label="Enabled"
                          labelPlacement="start"
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        label="WhatsApp Click-to-Chat URL"
                        placeholder="e.g. https://wa.me/1234567890"
                        value={whatsappUrl}
                        onChange={(e) => setWhatsappUrl(e.target.value)}
                        disabled={!whatsappEnabled}
                        helperText="Provide full wa.me direct chat link"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Instagram */}
                <Grid container sx={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} variant="subtitle2">
                          Instagram Profile
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={instagramEnabled}
                              onChange={(e) => setInstagramEnabled(e.target.checked)}
                            />
                          }
                          label="Enabled"
                          labelPlacement="start"
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        label="Instagram URL"
                        placeholder="e.g. https://instagram.com/careerbot"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        disabled={!instagramEnabled}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Twitter / X */}
                <Grid container sx={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} variant="subtitle2">
                          X (Twitter) Handle
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={twitterEnabled}
                              onChange={(e) => setTwitterEnabled(e.target.checked)}
                            />
                          }
                          label="Enabled"
                          labelPlacement="start"
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        label="X (Twitter) Profile URL"
                        placeholder="e.g. https://x.com/careerbot"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        disabled={!twitterEnabled}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Support Email */}
                <Grid container sx={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} variant="subtitle2">
                          Support Email Address
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={supportEmailEnabled}
                              onChange={(e) => setSupportEmailEnabled(e.target.checked)}
                            />
                          }
                          label="Enabled"
                          labelPlacement="start"
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        type="email"
                        label="Support Email Address"
                        placeholder="e.g. support@careerbot.com"
                        value={supportEmailAddr}
                        onChange={(e) => setSupportEmailAddr(e.target.value)}
                        disabled={!supportEmailEnabled}
                        helperText="Feedback submissions will be delivered here"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateSettingsMutation.isPending}
                  startIcon={updateSettingsMutation.isPending ? <CircularProgress size={16} /> : null}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Save Channels
                </Button>
              </Box>
            </Box>
          </ConfigSectionCard>
        </Stack>
      )}

      {/* SMTP Management Tab */}
      {tabValue === 1 && (
        <Stack spacing={3}>
          <ConfigSectionCard
            title="SMTP Configuration Profiles"
            description="Add and manage multiple outgoing SMTP configurations. Only one active profile is used to send feedback notifications."
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenSmtpDialog()}
                sx={{ borderRadius: 2 }}
              >
                Add SMTP Profile
              </Button>
            }
          >
            <Grid container spacing={3}>
              {data?.smtps?.length === 0 ? (
                <Grid container sx={{ xs: 12 }}>
                  <Box py={6} textAlign="center" sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
                    <Typography color="text.secondary" variant="body2">
                      No SMTP profiles configured. Outgoing email will not function.
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                data?.smtps?.map((smtp) => (
                  <Grid container sx={{ xs: 12, md: 6 }} key={smtp.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: smtp.isActive ? "primary.main" : "divider",
                        borderWidth: smtp.isActive ? 2 : 1,
                        boxShadow: smtp.isActive ? "0 4px 12px rgba(99, 102, 241, 0.08)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              {smtp.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                              {smtp.host}:{smtp.port}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {smtp.isActive ? (
                              <Chip
                                label="Active"
                                color="primary"
                                size="small"
                                icon={<Check size={12} />}
                                sx={{ fontWeight: 700 }}
                              />
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setActiveSmtpMutation.mutate(smtp.id)}
                                disabled={setActiveSmtpMutation.isPending}
                                sx={{ borderRadius: 2, py: 0.2, fontSize: "0.75rem" }}
                              >
                                Set Active
                              </Button>
                            )}
                          </Stack>
                        </Stack>

                        <Stack spacing={0.5} mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Username:</strong> {smtp.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Secure Flag:</strong> {smtp.secure ? "SSL/TLS (Secure)" : "STARTTLS / Standard"}
                          </Typography>
                        </Stack>
                      </CardContent>

                      <Divider />

                      <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1.5, bgcolor: "action.hover" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleTestConnection(smtp.id)}
                          disabled={testingSmtpId !== null}
                          startIcon={
                            testingSmtpId === smtp.id ? (
                              <CircularProgress size={12} color="inherit" />
                            ) : (
                              <Send size={12} />
                            )
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          Test Connection
                        </Button>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenSmtpDialog(smtp)}
                            aria-label="Edit Profile"
                          >
                            <Edit2 size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this SMTP profile?")) {
                                deleteSmtpMutation.mutate(smtp.id);
                              }
                            }}
                            aria-label="Delete Profile"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </ConfigSectionCard>
        </Stack>
      )}

      {/* Add/Edit SMTP Dialog */}
      <Dialog
        open={smtpDialogOpen}
        onClose={() => !saveSmtpMutation.isPending && setSmtpDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={800}>
            {editingSmtp ? "Edit SMTP Profile" : "Create SMTP Profile"}
          </Typography>
        </DialogTitle>

        <Box component="form" onSubmit={handleSaveSmtp}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5}>
              <TextField
                required
                fullWidth
                size="small"
                label="Profile Name"
                placeholder="e.g. Primary Gmail"
                value={smtpName}
                onChange={(e) => setSmtpName(e.target.value)}
                disabled={saveSmtpMutation.isPending}
              />
              <Grid container spacing={2}>
                <Grid container sx={{ xs: 8 }}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="SMTP Host"
                    placeholder="e.g. smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    disabled={saveSmtpMutation.isPending}
                  />
                </Grid>
                <Grid container sx={{ xs: 4 }}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    type="number"
                    label="Port"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    disabled={saveSmtpMutation.isPending}
                  />
                </Grid>
              </Grid>
              <TextField
                required
                fullWidth
                size="small"
                label="Username (Email)"
                placeholder="e.g. support@example.com"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                disabled={saveSmtpMutation.isPending}
              />
              <TextField
                required={!editingSmtp}
                fullWidth
                size="small"
                type="password"
                label={editingSmtp ? "Password (Leave blank to keep current)" : "Password / App Password"}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                disabled={saveSmtpMutation.isPending}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    disabled={saveSmtpMutation.isPending}
                  />
                }
                label="Secure Connection (SSL/TLS - Port 465)"
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setSmtpDialogOpen(false)}
              disabled={saveSmtpMutation.isPending}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saveSmtpMutation.isPending}
              startIcon={saveSmtpMutation.isPending ? <CircularProgress size={12} color="inherit" /> : null}
              sx={{ borderRadius: 2 }}
            >
              Save Profile
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
