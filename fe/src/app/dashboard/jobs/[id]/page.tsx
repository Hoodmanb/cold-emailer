"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Stack,
  Typography,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  useGetJob,
  useGetDocuments,
  useGetEmailHistory,
  useApproveDocument,
  useApproveEmail,
  useRegenerate,
  useRerunATS,
  useGetAuditLog,
} from "@/hooks/queryHooks";
import KeywordGrid from "@/components/layout/KeywordGrid";
import GeneratePanel from "@/components/layout/GeneratePanel";
import DocumentViewer from "@/components/layout/DocumentViewer";
import EmailScoreCard from "@/components/layout/EmailScoreCard";
import ScoreRing from "@/components/layout/ScoreRing";
import DraftBadge from "@/components/layout/DraftBadge";
import {
  Building2,
  MapPin,
  Calendar,
  RefreshCcw,
  Edit,
  Trash2,
  MoreVertical,
  Terminal,
  FileText,
  Mail,
  Info,
} from "lucide-react";
import { useSnackbar } from "@/context/SnackbarContext";
import axiosInstance from "@/hooks/axios";

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`job-tabpanel-${index}`}
      aria-labelledby={`job-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `job-tab-${index}`,
    "aria-controls": `job-tabpanel-${index}`,
  };
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSnackbar } = useSnackbar();

  // API Queries
  const { job, loading, refetch } = useGetJob(id);
  const { documents, refetch: refetchDocs } = useGetDocuments(id);
  const { emails, refetch: refetchEmails } = useGetEmailHistory(id);
  const { logs, refetch: refetchLogs } = useGetAuditLog(100);

  // API Mutations
  const { approve: approveDoc } = useApproveDocument();
  const { approve: approveEmail } = useApproveEmail();
  const { regenerate } = useRegenerate();
  const { rerun: rerunATS, busy: rerunning } = useRerunATS();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states for Editing
  const [editForm, setEditForm] = useState({
    title: "",
    company: "",
    location: "",
    rawDescription: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (job) {
      setEditForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        rawDescription: job.rawDescription || "",
      });
    }
  }, [job]);

  if (loading || !job) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  // Filtered audit logs for the current job
  const filteredLogs = logs.filter(
    (log) => log.jobId === id || log.entityId === id
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      await approveDoc(docId);
      showSnackbar("Document approved", "success");
      refetchDocs();
    } catch {
      showSnackbar("Failed to approve", "error");
    }
  };

  const handleApproveEmail = async (emailId: string) => {
    try {
      await approveEmail(emailId);
      showSnackbar("Email approved", "success");
      refetchEmails();
    } catch {
      showSnackbar("Failed to approve", "error");
    }
  };

  const handleRegen = async (type: "resume" | "cover-letter" | "email") => {
    try {
      await regenerate(job.id, type);
      showSnackbar(`${type} regenerated`, "success");
      refetchDocs();
      refetchEmails();
    } catch {
      showSnackbar("Failed to regenerate", "error");
    }
  };

  const handleRerunATS = async () => {
    try {
      await rerunATS(job.id);
      showSnackbar("ATS analysis re-calculated", "success");
      await refetch();
      refetchLogs();
    } catch (e) {
      console.error(e);
      showSnackbar("Failed to re-run ATS analysis", "error");
    }
  };

  const handleDeleteJob = async () => {
    try {
      await axiosInstance.delete(`/api/jobs/${id}`);
      showSnackbar("Job deleted successfully", "success");
      router.push("/dashboard/jobs");
    } catch {
      showSnackbar("Failed to delete job", "error");
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.title || !editForm.company || !editForm.rawDescription) {
      showSnackbar("Title, Company, and Job Description are required", "warning");
      return;
    }
    setSavingEdit(true);
    try {
      await axiosInstance.put(`/api/jobs/${id}`, editForm);
      showSnackbar("Job details updated successfully", "success");
      await refetch();
      refetchLogs();
      setEditOpen(false);
    } catch {
      showSnackbar("Failed to update job details", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* ─── HEADER SECTION ─── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 3,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack gap={1}>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2.2rem" },
                  fontWeight: 800,
                  color: "text.primary",
                }}
              >
                {job.title}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                gap={{ xs: 1, sm: 3 }}
                mt={1}
              >
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Building2 size={16} color="#6b7280" />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {job.company}
                  </Typography>
                </Stack>
                {job.location && (
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <MapPin size={16} color="#9ca3af" />
                    <Typography variant="body2" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Calendar size={16} color="#9ca3af" />
                  <Typography variant="body2" color="text.secondary">
                    Added {new Date(job.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack
              direction={{ xs: "row", sm: "row" }}
              spacing={1}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              alignItems="center"
              width="100%"
            >
              {/* Responsive actions for mobile vs desktop */}
              {isMobile ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleRerunATS}
                    disabled={rerunning}
                    startIcon={rerunning ? <CircularProgress size={14} /> : <RefreshCcw size={14} />}
                    sx={{ flexGrow: 1, textTransform: "none", fontWeight: 700 }}
                  >
                    {rerunning ? "Scanning..." : "ATS Scan"}
                  </Button>
                  <IconButton
                    aria-label="More actions"
                    onClick={handleMenuOpen}
                    size="large"
                    sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                  >
                    <MoreVertical size={20} />
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        setEditOpen(true);
                      }}
                    >
                      <Edit size={16} style={{ marginRight: 8 }} /> Edit Job
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        setDeleteOpen(true);
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <Trash2 size={16} style={{ marginRight: 8 }} /> Delete Job
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit size={16} />}
                    onClick={() => setEditOpen(true)}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => setDeleteOpen(true)}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleRerunATS}
                    disabled={rerunning}
                    startIcon={rerunning ? <CircularProgress size={14} /> : <RefreshCcw size={14} />}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                  >
                    {rerunning ? "Calculating..." : "Re-run ATS Scan"}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── MAIN CONTENT AREA ─── */}
      <Grid container spacing={3}>
        {/* Primary column (tabs, detail content) */}
        <Grid
          size={{ xs: 12, md: 8, lg: 9 }}
          sx={{
            height: { md: "calc(100vh - 290px)" },
            overflowY: { md: "auto" },
            pr: { md: 2 },
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.divider,
              borderRadius: "4px",
            },
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : undefined}
                aria-label="job sections"
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  },
                }}
              >
                <Tab label="Job Overview" icon={<Info size={16} />} iconPosition="start" {...a11yProps(0)} />
                <Tab
                  label={`Documents (${documents.length})`}
                  icon={<FileText size={16} />}
                  iconPosition="start"
                  {...a11yProps(1)}
                />
                <Tab
                  label={`Cold Emails (${emails.length})`}
                  icon={<Mail size={16} />}
                  iconPosition="start"
                  {...a11yProps(2)}
                />
                <Tab
                  label={`Audit Logs (${filteredLogs.length})`}
                  icon={<Terminal size={16} />}
                  iconPosition="start"
                  {...a11yProps(3)}
                />
              </Tabs>
            </Box>

            {/* TAB 0: Job Overview & AI Generator */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <GeneratePanel
                    jobId={job.id}
                    initialAts={
                      job.atsScore !== null && job.atsBreakdown
                        ? {
                          score: job.atsScore,
                          matchedKeywords: job.atsBreakdown.matchedKeywords || [],
                          missingKeywords: job.atsBreakdown.missingKeywords || [],
                          breakdown: (job.atsBreakdown as any).breakdown || {},
                          scoredAt:
                            (job.atsBreakdown as any).scoredAt ||
                            new Date().toISOString(),
                        }
                        : null
                    }
                    onComplete={() => {
                      refetchDocs();
                      refetchEmails();
                      void refetch();
                    }}
                  />
                </Grid>

                {job.atsBreakdown && (
                  <Grid size={{ xs: 12 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        ATS Keyword Analysis
                      </Typography>
                      <KeywordGrid
                        matched={job.atsBreakdown.matchedKeywords || []}
                        missing={job.atsBreakdown.missingKeywords || []}
                        title=""
                      />
                    </Paper>
                  </Grid>
                )}

                {job.rawDescription && (
                  <Grid size={{ xs: 12 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        Original Job Description
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          color: "text.secondary",
                          lineHeight: 1.7,
                          maxHeight: 400,
                          overflowY: "auto",
                          pr: 1,
                        }}
                      >
                        {job.rawDescription}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            {/* TAB 1: Generated Documents */}
            <TabPanel value={tabValue} index={1}>
              <Stack gap={2.5}>
                {documents.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Typography color="text.secondary">
                      No documents generated yet. Use the "Job Overview" panel to tailor your first resume.
                    </Typography>
                  </Paper>
                ) : (
                  documents.map((doc) => (
                    <DocumentViewer
                      key={doc.id}
                      document={doc}
                      onApprove={handleApproveDoc}
                      onRegenerate={() =>
                        handleRegen(
                          doc.type as "resume" | "cover-letter" | "email"
                        )
                      }
                    />
                  ))
                )}
              </Stack>
            </TabPanel>

            {/* TAB 2: Cold Emails */}
            <TabPanel value={tabValue} index={2}>
              <Stack gap={2.5}>
                {emails.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Typography color="text.secondary">
                      No cold outreach emails generated yet. Use the "Job Overview" panel to compose outreach messages.
                    </Typography>
                  </Paper>
                ) : (
                  emails.map((email) => (
                    <Paper
                      key={email.id}
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        border: 1,
                        borderColor:
                          email.status === "draft" ? "warning.main" : "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack gap={2}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          gap={{ xs: 1.5, sm: 0 }}
                        >
                          <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                            >
                              To: {email.to || "Not specified"}
                            </Typography>
                            <DraftBadge status={email.status} />
                          </Stack>
                          {email.status === "draft" && (
                            <Chip
                              label="Approve & Send"
                              color="success"
                              onClick={() => handleApproveEmail(email.id)}
                              sx={{
                                cursor: "pointer",
                                fontWeight: 700,
                                width: { xs: "100%", sm: "auto" },
                              }}
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                        >
                          Subject: {email.subject}
                        </Typography>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "grey.900",
                            color: "grey.100",
                            overflowX: "auto",
                          }}
                        >
                          <Typography
                            component="pre"
                            sx={{
                              whiteSpace: "pre-wrap",
                              fontFamily: "monospace",
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            {email.body}
                          </Typography>
                        </Box>
                        <EmailScoreCard scores={email.scores} />
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </TabPanel>

            {/* TAB 3: Audit Logs & Cli history */}
            <TabPanel value={tabValue} index={3}>
              <Paper
                sx={{
                  bgcolor: "grey.100",
                  color: "grey.100",
                  p: 2.5,
                  borderRadius: 2,
                  maxHeight: 480,
                  overflowY: "auto",
                  border: 1,
                  borderColor: "grey.300",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="success.main"
                  fontFamily="monospace"
                  gutterBottom
                >
                  system@careerbot:~# tail -n 100 job_audit.log
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mt: 2,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  {filteredLogs.length === 0 ? (
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace", color: "grey.500" }}
                    >
                      [system] no audit log events recorded for this job yet.
                    </Typography>
                  ) : (
                    filteredLogs.map((log) => (
                      <Box
                        key={log.id}
                        sx={{
                          borderBottom: 1,
                          borderColor: "grey.300",
                          pb: 1,
                          "&:last-child": { border: 0, pb: 0 },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{ color: "info.main", mr: 1, fontFamily: "monospace", fontSize: "inherit" }}
                        >
                          [{new Date(log.timestamp).toLocaleString()}]
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            color: "warning.main",
                            mr: 1.5,
                            fontFamily: "monospace",
                            fontSize: "inherit",
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: "grey.500", fontFamily: "monospace", fontSize: "inherit" }}
                        >
                          {log.details || `Module: ${log.module || "N/A"}`}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </TabPanel>
          </Box>
        </Grid>

        {/* Secondary sidebar (metadata, sticky on desktop) */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Box
            sx={{
              position: { md: "sticky" },
              top: 94,
              height: { md: "calc(100vh - 290px)" },
              overflowY: { md: "auto" },
              display: "flex",
              flexDirection: "column",
              gap: 3,
              pr: { md: 1 },
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: theme.palette.divider,
                borderRadius: "2px",
              },
            }}
          >
            {/* ATS Overview widget */}
            {job.atsScore !== null && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  ATS Score Analysis
                </Typography>
                <ScoreRing score={job.atsScore} size={110} label="Match Score" />
                <Typography variant="caption" color="text.secondary">
                  Based on current Career Profile details
                </Typography>
              </Paper>
            )}

            {/* General Info Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
                Job Properties
              </Typography>
              <List dense disablePadding>
                <ListItem disableGutters sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={job.status || "active"}
                        size="small"
                        color={job.status === "archived" ? "default" : "success"}
                        sx={{ mt: 0.5, fontWeight: 700, textTransform: "capitalize" }}
                      />
                    }
                  />
                </ListItem>
                <ListItem disableGutters sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
                  <ListItemText
                    primary="Workplace Type"
                    secondary={job.type || "Not Specified"}
                    secondaryTypographyProps={{ sx: { fontWeight: 700, mt: 0.5, color: "text.primary" } }}
                  />
                </ListItem>
                <ListItem disableGutters sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
                  <ListItemText
                    primary="Generated Files"
                    secondary={`${documents.length} docs, ${emails.length} emails`}
                    secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                  />
                </ListItem>
                <ListItem disableGutters sx={{ py: 1, pb: 0 }}>
                  <ListItemText
                    primary="Last Sync"
                    secondary={new Date(job.updatedAt || job.createdAt).toLocaleString()}
                    secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* ─── DIALOGS ─── */}

      {/* Edit Job Dialog */}
      <Dialog open={editOpen} onClose={() => !savingEdit && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Job Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3.5} sx={{ mt: 1 }}>
            <TextField
              label="Position Title"
              fullWidth
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <TextField
              label="Company Name"
              fullWidth
              value={editForm.company}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              required
            />
            <TextField
              label="Workplace Location"
              fullWidth
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="e.g. Remote, Lagos, Nigeria"
            />
            <TextField
              label="Job Description"
              fullWidth
              multiline
              rows={8}
              value={editForm.rawDescription}
              onChange={(e) => setEditForm({ ...editForm, rawDescription: e.target.value })}
              required
              helperText="Paste the full job description details. ATS matches against this text."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={savingEdit} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={savingEdit}
            startIcon={savingEdit && <CircularProgress size={14} />}
          >
            {savingEdit ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>Delete Job Tracking?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete <strong>{job.title}</strong> at <strong>{job.company}</strong>?
            This will remove all associated statistics, and generated history from the database. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteJob} variant="contained" color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container >
  );
}