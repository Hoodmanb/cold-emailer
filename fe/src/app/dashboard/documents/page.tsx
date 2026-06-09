"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip,
  CircularProgress, LinearProgress, Stack, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Menu, Alert,
  useMediaQuery, useTheme, Card, CardContent, Grid, Divider,
  Badge,
} from "@mui/material";
import {
  Eye, Download, Edit2, Trash2, FileText, Search, BarChart3,
  Copy, Pencil, MoreVertical, FileOutput, CloudUpload, X, FileUp,
  SlidersHorizontal,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { downloadAuthenticatedFile } from "@/utils/downloadUtils";
import DocumentPreviewModal from "@/components/documents/DocumentPreviewModal";
import DocumentEditModal from "@/components/documents/DocumentEditModal";
import { format } from "date-fns";
import type { DocumentFormat } from "@/types";

const FORMAT_CHIP: Record<string, { color: "primary" | "success" | "default"; label: string }> = {
  pdf: { color: "primary", label: "PDF" },
  docx: { color: "success", label: "DOCX" },
  txt: { color: "default", label: "TXT" },
};

const TYPE_LABELS: Record<string, string> = {
  resume: "Resume",
  "professional-cv": "Professional CV",
  "cover-letter": "Cover Letter",
  email: "Cold Email",
};

const SOURCE_LABELS: Record<string, string> = {
  "user_upload": "User Upload",
  "widget": "Widget",
  "workflow": "ATS Workflow",
  "advanced-generation": "Quick Access",
  "manual": "Manual",
  "duplicate": "Duplicate",
  "editor": "Editor",
  "ai-pipeline": "AI Pipeline",
};

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
const MAX_FILE_SIZE_MB = 10;

const detectTypeFromFilename = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("resume")) return "resume";
  if (lower.includes("cv")) return "professional-cv";
  if (lower.includes("cover")) return "cover-letter";
  if (lower.includes("email")) return "email";
  return "";
};

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // ─── STATE: Document list ────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [renameDoc, setRenameDoc] = useState<any>(null);
  const [renameValue, setRenameValue] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; doc: any } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ─── STATE: Upload modal ─────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setSelectedType("");
    setSelectedFormat("");
    setUploadError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openUploadModal = useCallback(() => {
    resetUploadState();
    setUploadModalOpen(true);
  }, [resetUploadState]);

  const handleFileSelect = useCallback((file: File | null) => {
    setUploadError(null);
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File too large. Max size: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setSelectedFile(file);
    setSelectedFormat(ext);
    setSelectedType((prev) => prev || detectTypeFromFilename(file.name));
  }, []);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
    e.target.value = "";
  }, [handleFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }, [handleFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ─── QUERY HOOKS ─────────────────────────────────────────────────
  const { data: documents = [], isLoading: loadingAi, error: errorAi } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/documents");
      return (res.data?.data || []) as any[];
    },
  });

  const { data: uploads = [], isLoading: loadingUploads, error: errorUploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/documents/uploads");
      return (res.data?.data || []) as any[];
    },
  });

  // ─── MEMOIZED VALUES ─────────────────────────────────────────────
  const normalizedUploads = useMemo(() => {
    return uploads.map((u: any) => ({
      id: u.id,
      title: u.title,
      type: u.type || 'resume',
      format: u.format || (u.fileType?.split('/')?.[1] ?? 'txt'),
      source: u.source ?? 'user_upload',
      fileUrl: u.fileUrl,
    }));
  }, [uploads]);

  const allDocs = useMemo(() => [...documents, ...normalizedUploads], [
    documents,
    normalizedUploads,
  ]);

  // ─── MUTATION HOOKS ────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async ({ file, type, format }: { file: File; type: string; format: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type || "resume");
      form.append("format", format);
      form.append("source", "user_upload");
      await axiosInstance.post("/api/documents/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar("File uploaded successfully", "success");
      closeUploadModal();
    },
    onError: (err: any) => {
      showSnackbar(err?.response?.data?.message || "Upload failed", "error");
      setUploadError(err?.response?.data?.message || "Upload failed. Please try again.");
    },
  });

  const closeUploadModal = useCallback(() => {
    if (uploadMutation.isPending) return;
    setUploadModalOpen(false);
    setTimeout(resetUploadState, 300);
  }, [uploadMutation.isPending, resetUploadState]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await axiosInstance.delete(`/api/documents/uploads/${id}`);
      } catch (e) {
        await axiosInstance.delete(`/api/documents/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      showSnackbar("Document deleted", "success");
    },
    onError: () => showSnackbar("Failed to delete document", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await axiosInstance.put(`/api/documents/${id}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar("Document saved", "success");
    },
    onError: () => showSnackbar("Failed to save document", "error"),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await axiosInstance.patch(`/api/documents/${id}/rename`, { title });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      showSnackbar("Document renamed", "success");
      setRenameDoc(null);
    },
    onError: () => showSnackbar("Failed to rename document", "error"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/api/documents/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar("Document duplicated", "success");
    },
    onError: () => showSnackbar("Failed to duplicate document", "error"),
  });

  // ─── MEMOIZED VALUES ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = allDocs.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      const fmt = doc.exportFormat || doc.format || "txt";
      if (formatFilter !== "all" && fmt !== formatFilter) return false;
      const src = doc.metadata?.source || doc.metadata?.createdVia || doc.source || "manual";
      if (sourceFilter !== "all" && src !== sourceFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (doc.title || "").toLowerCase().includes(q) ||
        (doc.type || "").toLowerCase().includes(q) ||
        fmt.toLowerCase().includes(q)
      );
    });
    return list;
  }, [allDocs, search, typeFilter, formatFilter, sourceFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "all") count++;
    if (formatFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    return count;
  }, [typeFilter, formatFilter, sourceFilter]);

  // ─── EVENT HANDLERS ──────────────────────────────────────────────
  const handleDownload = async (doc: any, exportFormat?: string) => {
    const url = doc.fileUrl || `/api/documents/${doc.id}/download`;
    setDownloadingId(doc.id);
    try {
      const fmt = exportFormat || doc.exportFormat || doc.format || "pdf";
      const label = (doc.title || doc.type).replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 50);
      await downloadAuthenticatedFile(url, `${label}.${fmt}`, fmt);
      showSnackbar(`Downloaded as ${fmt.toUpperCase()}`, "success");
    } catch {
      showSnackbar("Download failed", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportAs = async (doc: any, fmt: DocumentFormat) => {
    setDownloadingId(doc.id);
    try {
      await axiosInstance.post(`/api/documents/${doc.id}/export`, { format: fmt });
      const label = (doc.title || doc.type).replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 50);
      await downloadAuthenticatedFile(`/api/documents/${doc.id}/download`, `${label}.${fmt}`, fmt);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar(`Exported as ${fmt.toUpperCase()}`, "success");
    } catch {
      showSnackbar("Export failed", "error");
    } finally {
      setDownloadingId(null);
      setMenuAnchor(null);
    }
  };

  const handleUploadSubmit = useCallback(() => {
    if (!selectedFile || !selectedFormat) {
      setUploadError("Please select a file and confirm the format.");
      return;
    }
    uploadMutation.mutate({
      file: selectedFile,
      type: selectedType || "resume",
      format: selectedFormat,
    });
  }, [selectedFile, selectedType, selectedFormat, uploadMutation]);

  const isUploadValid = selectedFile && selectedFormat && selectedType;

  const clearFilters = useCallback(() => {
    setTypeFilter("all");
    setFormatFilter("all");
    setSourceFilter("all");
    setSearch("");
  }, []);

  // ─── RENDER HELPERS ──────────────────────────────────────────────
  const renderDocumentCard = (doc: any) => {
    const fmt = doc.exportFormat || doc.format || "txt";
    const fmtInfo = FORMAT_CHIP[fmt] || { color: "default" as const, label: fmt.toUpperCase() };
    const isDownloading = downloadingId === doc.id;
    const updatedDate = doc.updatedAt
      ? format(new Date(doc.updatedAt), "MMM d, yyyy")
      : doc.createdAt
        ? format(new Date(doc.createdAt), "MMM d, yyyy")
        : null;

    return (
      <Card
        key={doc.id}
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderColor: "divider",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: theme.shadows[3],
            borderColor: "primary.light",
            transform: "translateY(-1px)",
          },
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {/* Top Section: Icon + Title + Format Chip */}
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <Stack direction="row" alignItems="flex-start" gap={2}>
              {/* File Icon */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: fmt === "pdf" ? "error.lighter" : fmt === "docx" ? "success.lighter" : "grey.100",
                  color: fmt === "pdf" ? "error.main" : fmt === "docx" ? "success.main" : "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                {fmt.toUpperCase()}
              </Box>

              {/* Title & Meta */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: "0.95rem", lineHeight: 1.3, mb: 0.5 }}
                >
                  {doc.title || TYPE_LABELS[doc.type] || doc.type}
                </Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={TYPE_LABELS[doc.type] || doc.type}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      bgcolor: "action.hover",
                      border: "none",
                    }}
                  />
                  {doc.editedManually && (
                    <Chip
                      label="Edited"
                      size="small"
                      color="warning"
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  )}
                  {(doc.templateName || doc.metadata?.templateName) && (
                    <Chip
                      label={doc.templateName || doc.metadata?.templateName}
                      size="small"
                      color="info"
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Middle Section: Source + Date + Job */}
          <Box sx={{ px: 2.5, pb: 2 }}>
            <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main", display: "inline-block" }} />
                {SOURCE_LABELS[doc.metadata?.source as string] || String(doc.metadata?.source || "legacy")}
              </Typography>
              {updatedDate && (
                <Typography variant="caption" color="text.secondary">
                  {updatedDate}
                </Typography>
              )}
              {(doc.generatedFromJobId || doc.jobId) && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  #{String(doc.generatedFromJobId || doc.jobId).substring(0, 8)}
                </Typography>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Bottom Section: Actions */}
          <Box sx={{ px: 1, py: 0.5, display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => setEditDoc(doc)}
                sx={{ color: "text.secondary", "&:hover": { color: "warning.main" }, p: 1.2 }}
              >
                <Edit2 size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Preview">
              <IconButton
                size="small"
                onClick={() => setPreviewDoc(doc)}
                sx={{ color: "text.secondary", "&:hover": { color: "primary.main" }, p: 1.2 }}
              >
                <Eye size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={() => handleDownload(doc)}
                disabled={isDownloading}
                sx={{ color: "text.secondary", "&:hover": { color: "success.main" }, p: 1.2 }}
              >
                {isDownloading ? <CircularProgress size={16} /> : <Download size={18} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="More">
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor({ el: e.currentTarget, doc })}
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" }, p: 1.2 }}
              >
                <MoreVertical size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <Stack gap={3} maxWidth={1200} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 2, sm: 4 }}>
      {/* Header */}
      <Box>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ letterSpacing: "-0.5px", fontSize: { xs: "1.6rem", sm: "2.125rem" }, mb: 0.5 }}
        >
          Documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} of {allDocs.length} document{allDocs.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Controls Bar — clean single row on md+, stacked on sm and below */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        gap={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Search size={16} /></InputAdornment>
            ),
            sx: { borderRadius: 2.5, bgcolor: "background.paper" },
          }}
          sx={{
            flex: { md: 1 },
            maxWidth: { md: 300 },
            width: { xs: "100%", md: "auto" },
          }}
        />

        {/* Right side: filters + upload */}
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {/* Desktop inline filters */}
          {!isTablet && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ borderRadius: 2.5, bgcolor: "background.paper" }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="resume">Resume</MenuItem>
                  <MenuItem value="professional-cv">Professional CV</MenuItem>
                  <MenuItem value="cover-letter">Cover Letter</MenuItem>
                  <MenuItem value="email">Cold Email</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Source"
                  onChange={(e) => setSourceFilter(e.target.value)}
                  sx={{ borderRadius: 2.5, bgcolor: "background.paper" }}
                >
                  <MenuItem value="all">All Sources</MenuItem>
                  <MenuItem value="user_upload">User Upload</MenuItem>
                  <MenuItem value="widget">Widget</MenuItem>
                  <MenuItem value="advanced-generation">Quick Access</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>Format</InputLabel>
                <Select
                  value={formatFilter}
                  label="Format"
                  onChange={(e) => setFormatFilter(e.target.value)}
                  sx={{ borderRadius: 2.5, bgcolor: "background.paper" }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx">DOCX</MenuItem>
                  <MenuItem value="txt">TXT</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {/* Mobile/Tablet Filter Toggle */}
          {isTablet && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SlidersHorizontal size={16} />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 600,
                flex: { xs: 1, md: "none" },
                borderColor: activeFilterCount > 0 ? "primary.main" : undefined,
                color: activeFilterCount > 0 ? "primary.main" : undefined,
              }}
            >
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  badgeContent={activeFilterCount}
                  color="primary"
                  sx={{ ml: 1, "& .MuiBadge-badge": { fontSize: "0.65rem", height: 16, minWidth: 16 } }}
                />
              )}
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<CloudUpload size={18} />}
            onClick={openUploadModal}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              flex: { xs: 1, md: "none" },
              whiteSpace: "nowrap",
            }}
          >
            Upload
          </Button>
        </Stack>
      </Stack>

      {/* Mobile/Tablet Filter Panel */}
      {isTablet && filtersOpen && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: "background.paper",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" fontWeight={700}>Filters</Typography>
            {activeFilterCount > 0 && (
              <Button size="small" onClick={clearFilters} sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Clear all
              </Button>
            )}
          </Stack>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="resume">Resume</MenuItem>
                  <MenuItem value="professional-cv">Professional CV</MenuItem>
                  <MenuItem value="cover-letter">Cover Letter</MenuItem>
                  <MenuItem value="email">Cold Email</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Source"
                  onChange={(e) => setSourceFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Sources</MenuItem>
                  <MenuItem value="user_upload">User Upload</MenuItem>
                  <MenuItem value="widget">Widget</MenuItem>
                  <MenuItem value="advanced-generation">Quick Access</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Format</InputLabel>
                <Select
                  value={formatFilter}
                  label="Format"
                  onChange={(e) => setFormatFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx">DOCX</MenuItem>
                  <MenuItem value="txt">TXT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Upload Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={closeUploadModal}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, px: { xs: 2, sm: 3 } }}>
          <FileUp size={20} /> Upload Document
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>
            {uploadError && (
              <Alert severity="error" onClose={() => setUploadError(null)} sx={{ borderRadius: 2 }}>
                {uploadError}
              </Alert>
            )}

            {/* Drop Zone */}
            <Box
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: isDragging ? "primary.main" : "divider",
                borderRadius: 3,
                p: { xs: 3, sm: 4 },
                textAlign: "center",
                cursor: "pointer",
                bgcolor: isDragging ? "primary.lighter" : "background.paper",
                transition: "all 0.2s",
                "&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept=".pdf,.docx,.txt"
                onChange={onFileInputChange}
              />
              <CloudUpload size={40} color={isDragging ? "primary" : "disabled"} />
              <Typography variant="body1" fontWeight={600} sx={{ mt: 1, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                {isDragging ? "Drop file here" : "Click or drag file to upload"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PDF, DOCX, TXT up to {MAX_FILE_SIZE_MB}MB
              </Typography>
            </Box>

            {/* Selected File */}
            {selectedFile && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <FileText size={24} color="primary" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{selectedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFormat.toUpperCase()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => { setSelectedFile(null); setSelectedFormat(""); }}
                  sx={{ color: "error.main" }}
                >
                  <X size={16} />
                </IconButton>
              </Paper>
            )}

            {/* Type & Format Selects */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth size="small" required error={!selectedType && !!selectedFile}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Document Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="resume">Resume</MenuItem>
                  <MenuItem value="professional-cv">Professional CV</MenuItem>
                  <MenuItem value="cover-letter">Cover Letter</MenuItem>
                  <MenuItem value="email">Cold Email</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" required>
                <InputLabel>Format</InputLabel>
                <Select
                  value={selectedFormat}
                  label="Format"
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx">DOCX</MenuItem>
                  <MenuItem value="txt">TXT</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {uploadMutation.isPending && <LinearProgress sx={{ borderRadius: 1 }} />}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, gap: 1 }}>
          <Button onClick={closeUploadModal} disabled={uploadMutation.isPending} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!isUploadValid || uploadMutation.isPending}
            onClick={handleUploadSubmit}
            sx={{ fontWeight: 700, borderRadius: 2 }}
            fullWidth={isMobile}
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      {loadingAi || loadingUploads ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : errorAi || errorUploads ? (
        <Box p={4} textAlign="center">
          <Typography color="error">Failed to load documents. Please try again later.</Typography>
        </Box>
      ) : documents.length === 0 && uploads.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 4, sm: 10 },
            borderRadius: 4,
            borderStyle: "dashed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <FileText size={56} style={{ opacity: 0.18 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700} textAlign="center">
            No documents yet
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
            Upload a document or open a job and run ATS analysis to generate your first document.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} width={{ xs: "100%", sm: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload size={16} />}
              onClick={openUploadModal}
              sx={{ borderRadius: 2.5, fontWeight: 700, mt: 1, width: { xs: "100%", sm: "auto" } }}
            >
              Upload Document
            </Button>
            <Button
              variant="outlined"
              startIcon={<BarChart3 size={16} />}
              href="/dashboard/jobs"
              sx={{ borderRadius: 2.5, fontWeight: 700, mt: 1, width: { xs: "100%", sm: "auto" } }}
            >
              Go to Jobs
            </Button>
          </Stack>
        </Paper>
      ) : isTablet ? (
        /* Card Grid for Mobile & Tablet */
        <Grid container spacing={2}>
          {filtered.map((doc: any) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
              {renderDocumentCard(doc)}
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Table for Desktop */
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Job</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((doc: any) => {
                const fmt = doc.exportFormat || doc.format || "txt";
                const fmtInfo = FORMAT_CHIP[fmt] || { color: "default" as const, label: fmt.toUpperCase() };
                return (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", flexShrink: 0 }}>
                          <FileText size={18} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{doc.title || TYPE_LABELS[doc.type] || doc.type}</Typography>
                          <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.25 }}>
                            {doc.editedManually && <Chip label="Edited" size="small" color="warning" variant="outlined" sx={{ fontSize: "0.6rem", height: 16 }} />}
                            {(doc.templateName || doc.metadata?.templateName) && (
                              <Chip
                                label={doc.templateName || doc.metadata?.templateName}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: "0.6rem", height: 16 }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={TYPE_LABELS[doc.type] || doc.type} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.68rem" }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={fmtInfo.label} size="small" color={fmtInfo.color} variant="outlined" sx={{ fontWeight: 700, fontSize: "0.68rem" }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={SOURCE_LABELS[doc.metadata?.source as string] || String(doc.metadata?.source || "legacy")}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {(doc.generatedFromJobId || doc.jobId) ? `#${String(doc.generatedFromJobId || doc.jobId).substring(0, 8)}` : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {doc.updatedAt ? format(new Date(doc.updatedAt), "MMM d, yyyy") : doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditDoc(doc)} sx={{ borderRadius: 1.5, color: "warning.main" }}><Edit2 size={16} /></IconButton></Tooltip>
                        <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewDoc(doc)} color="primary" sx={{ borderRadius: 1.5 }}><Eye size={16} /></IconButton></Tooltip>
                        <Tooltip title="Download"><IconButton size="small" onClick={() => handleDownload(doc)} color="success" disabled={downloadingId === doc.id} sx={{ borderRadius: 1.5 }}>{downloadingId === doc.id ? <CircularProgress size={14} /> : <Download size={16} />}</IconButton></Tooltip>
                        <Tooltip title="More"><IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, doc })} sx={{ borderRadius: 1.5 }}><MoreVertical size={16} /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor?.el} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setRenameDoc(menuAnchor!.doc); setRenameValue(menuAnchor!.doc.title || ""); setMenuAnchor(null); }}>
          <Pencil size={14} style={{ marginRight: 8 }} /> Rename
        </MenuItem>
        <MenuItem onClick={() => { duplicateMutation.mutate(menuAnchor!.doc.id); setMenuAnchor(null); }}>
          <Copy size={14} style={{ marginRight: 8 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => handleExportAs(menuAnchor!.doc, "pdf")}><FileOutput size={14} style={{ marginRight: 8 }} /> Export as PDF</MenuItem>
        <MenuItem onClick={() => handleExportAs(menuAnchor!.doc, "docx")}><FileOutput size={14} style={{ marginRight: 8 }} /> Export as DOCX</MenuItem>
        <MenuItem onClick={() => handleExportAs(menuAnchor!.doc, "txt")}><FileOutput size={14} style={{ marginRight: 8 }} /> Export as TXT</MenuItem>
        <MenuItem onClick={() => { if (window.confirm("Delete this document?")) deleteMutation.mutate(menuAnchor!.doc.id); setMenuAnchor(null); }} sx={{ color: "error.main" }}>
          <Trash2 size={14} style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameDoc}
        onClose={() => setRenameDoc(null)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle fontWeight={800} sx={{ px: { xs: 2, sm: 3 } }}>Rename Document</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <TextField fullWidth value={renameValue} onChange={(e) => setRenameValue(e.target.value)} label="Title" sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, gap: 1 }}>
          <Button onClick={() => setRenameDoc(null)} fullWidth={isMobile}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!renameValue.trim() || renameMutation.isPending}
            onClick={() => renameMutation.mutate({ id: renameDoc.id, title: renameValue.trim() })}
            sx={{ fontWeight: 700 }}
            fullWidth={isMobile}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview & Edit Modals */}
      <DocumentPreviewModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} document={previewDoc} onDownload={previewDoc ? () => handleDownload(previewDoc) : undefined} />
      <DocumentEditModal open={!!editDoc} onClose={() => setEditDoc(null)} document={editDoc} onSave={async (id, updates) => { await updateMutation.mutateAsync({ id, updates }); }} autoSave />
    </Stack>
  );
};

export default DocumentsPage;