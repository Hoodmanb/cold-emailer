"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip,
  CircularProgress, Stack, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Menu,
} from "@mui/material";
import {
  Eye, Download, Edit2, Trash2, FileText, Search, BarChart3,
  Copy, Pencil, MoreVertical, FileOutput,
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
  widget: "Widget",
  workflow: "ATS Workflow",
  "advanced-generation": "Quick Access",
  manual: "Manual",
  duplicate: "Duplicate",
  editor: "Editor",
  "ai-pipeline": "AI Pipeline",
};

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

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

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/documents");
      return (res.data?.data || []) as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axiosInstance.delete(`/api/documents/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); showSnackbar("Document deleted", "success"); },
    onError: () => showSnackbar("Failed to delete document", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await axiosInstance.put(`/api/documents/${id}`, updates);
      return res.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); showSnackbar("Document saved", "success"); },
    onError: () => showSnackbar("Failed to save document", "error"),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await axiosInstance.patch(`/api/documents/${id}/rename`, { title });
      return res.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); showSnackbar("Document renamed", "success"); setRenameDoc(null); },
    onError: () => showSnackbar("Failed to rename document", "error"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/api/documents/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); showSnackbar("Document duplicated", "success"); },
    onError: () => showSnackbar("Failed to duplicate document", "error"),
  });

  const handleDownload = async (doc: any, exportFormat?: string) => {
    setDownloadingId(doc.id);
    try {
      const fmt = exportFormat || doc.exportFormat || doc.format || "pdf";
      const label = (doc.title || doc.type).replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 50);
      await downloadAuthenticatedFile(`/api/documents/${doc.id}/download`, `${label}.${fmt}`, fmt);
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

  const filtered = useMemo(() => documents.filter((doc) => {
    if (typeFilter !== "all" && doc.type !== typeFilter) return false;
    const fmt = doc.exportFormat || doc.format || "txt";
    if (formatFilter !== "all" && fmt !== formatFilter) return false;
    const src = doc.metadata?.source || doc.metadata?.createdVia || "manual";
    if (sourceFilter !== "all" && src !== sourceFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (doc.title || "").toLowerCase().includes(q) ||
      (doc.type || "").toLowerCase().includes(q) ||
      fmt.toLowerCase().includes(q)
    );
  }), [documents, search, typeFilter, formatFilter, sourceFilter]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error">Failed to load documents. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Stack gap={3} maxWidth={1200} mx="auto" px={{ xs: 2, sm: 3 }} py={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-end" }} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-0.5px" }}>Documents</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {filtered.length} of {documents.length} document{documents.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <TextField size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>, sx: { borderRadius: 2.5 } }}
            sx={{ width: 180 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)} sx={{ borderRadius: 2.5 }}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="resume">Resume</MenuItem>
              <MenuItem value="professional-cv">Professional CV</MenuItem>
              <MenuItem value="cover-letter">Cover Letter</MenuItem>
              <MenuItem value="email">Cold Email</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Source</InputLabel>
            <Select value={sourceFilter} label="Source" onChange={(e) => setSourceFilter(e.target.value)} sx={{ borderRadius: 2.5 }}>
              <MenuItem value="all">All Sources</MenuItem>
              <MenuItem value="workflow">ATS Workflow</MenuItem>
              <MenuItem value="widget">Widget</MenuItem>
              <MenuItem value="advanced-generation">Quick Access</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Format</InputLabel>
            <Select value={formatFilter} label="Format" onChange={(e) => setFormatFilter(e.target.value)} sx={{ borderRadius: 2.5 }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="docx">DOCX</MenuItem>
              <MenuItem value="txt">TXT</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {documents.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 10, borderRadius: 4, borderStyle: "dashed", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
          <FileText size={56} style={{ opacity: 0.18 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>No documents yet</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">Open a job, run ATS analysis, and generate your first document.</Typography>
          <Button variant="outlined" startIcon={<BarChart3 size={16} />} href="/dashboard/jobs" sx={{ borderRadius: 2.5, fontWeight: 700, mt: 1 }}>Go to Jobs</Button>
        </Paper>
      ) : (
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

      <Dialog open={!!renameDoc} onClose={() => setRenameDoc(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Rename Document</DialogTitle>
        <DialogContent>
          <TextField fullWidth value={renameValue} onChange={(e) => setRenameValue(e.target.value)} label="Title" sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameDoc(null)}>Cancel</Button>
          <Button variant="contained" disabled={!renameValue.trim() || renameMutation.isPending} onClick={() => renameMutation.mutate({ id: renameDoc.id, title: renameValue.trim() })} sx={{ fontWeight: 700 }}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentPreviewModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} document={previewDoc} onDownload={previewDoc ? () => handleDownload(previewDoc) : undefined} />
      <DocumentEditModal open={!!editDoc} onClose={() => setEditDoc(null)} document={editDoc} onSave={async (id, updates) => { await updateMutation.mutateAsync({ id, updates }); }} autoSave />
    </Stack>
  );
};

export default DocumentsPage;
