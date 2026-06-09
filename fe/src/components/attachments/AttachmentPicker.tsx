"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  MenuItem,
  Checkbox,
} from "@mui/material";
import { Search, Upload, FileText, X, Paperclip } from "lucide-react";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { useDocumentLibrary } from "@/hooks/queryHooks/attachments";

export type AttachmentRecord = {
  id: string;
  sourceDocumentId: string;
  parentId?: string;
  parentType?: string;
  title: string;
  customName?: string | null;
  type: string;
  format: string;
  fileUrl?: string;
  source: "ai_generated" | "user_upload" | string;
};

export type LibraryDocument = {
  id: string;
  title: string;
  type: string;
  format: string;
  source: "ai_generated" | "user_upload";
  createdAt?: string;
  fileUrl?: string;
  previewUrl?: string;
};

type AttachmentPickerProps = {
  open: boolean;
  onClose: () => void;
  parentId: string;
  parentType: string;
  selected?: AttachmentRecord[];
  onChange: (attachments: AttachmentRecord[]) => void;
  multiSelect?: boolean;
};

const TYPE_FILTERS = ["all", "resume", "cv", "cover-letter", "email", "upload"];
const FORMAT_FILTERS = ["all", "pdf", "docx", "txt", "html"];

export default function AttachmentPicker({
  open,
  onClose,
  parentId,
  parentType,
  selected = [],
  onChange,
  multiSelect = true,
}: AttachmentPickerProps) {
  const { showSnackbar } = useSnackbar();
  const { documents, loading, error, refetch } = useDocumentLibrary();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set(selected.map((s) => s.sourceDocumentId)));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        doc.source.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || doc.type.includes(typeFilter);
      const matchesFormat = formatFilter === "all" || doc.format === formatFilter;
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [documents, search, typeFilter, formatFilter]);

  const toggleSelect = (doc: LibraryDocument) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(doc.id)) {
        next.delete(doc.id);
      } else if (multiSelect) {
        next.add(doc.id);
      } else {
        return new Set([doc.id]);
      }
      return next;
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axiosInstance.post("/api/documents/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showSnackbar("File uploaded", "success");
      await refetch();
    } catch {
      showSnackbar("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const created: AttachmentRecord[] = [];
      for (const doc of documents) {
        if (!pendingIds.has(doc.id)) continue;
        if (selected.some((s) => s.sourceDocumentId === doc.id)) {
          const existing = selected.find((s) => s.sourceDocumentId === doc.id);
          if (existing) created.push(existing);
          continue;
        }
        const res = await axiosInstance.post("/api/attachment", {
          sourceDocumentId: doc.id,
          parentId,
          parentType,
          customName: doc.title,
        });
        created.push(res.data.data);
      }

      const removed = selected.filter((s) => !pendingIds.has(s.sourceDocumentId));
      for (const item of removed) {
        await axiosInstance.delete(`/api/attachment/${item.id}`);
      }

      onChange(created);
      onClose();
    } catch {
      showSnackbar("Failed to save attachments", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Paperclip size={20} />
          <Typography fontWeight={700}>Attach Documents</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search size={16} /></InputAdornment>
              ),
            }}
          />
          <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 120 }}>
            {TYPE_FILTERS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Format" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} sx={{ minWidth: 120 }}>
            {FORMAT_FILTERS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </TextField>
          <Button
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={16} /> : <Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Upload New
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load documents</Alert>}

        {loading ? (
          <Stack alignItems="center" py={6}><CircularProgress /></Stack>
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
            <FileText size={40} style={{ opacity: 0.2 }} />
            <Typography mt={2} color="text.secondary">No documents found</Typography>
          </Paper>
        ) : (
          <Stack gap={1}>
            {filtered.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                onClick={() => toggleSelect(doc)}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: pendingIds.has(doc.id) ? "primary.main" : "divider",
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              >
                <Stack direction="row" alignItems="center" gap={2}>
                  <Checkbox checked={pendingIds.has(doc.id)} />
                  <Box flex={1}>
                    <Typography fontWeight={700}>{doc.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.type} · {doc.format.toUpperCase()} · {doc.source === "ai_generated" ? "AI Generated" : "Uploaded"}
                    </Typography>
                  </Box>
                  <Chip size="small" label={doc.format.toUpperCase()} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleConfirm()}>
          Attach {pendingIds.size > 0 ? `(${pendingIds.size})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AttachmentPreviewList({
  attachments,
  onRemove,
}: {
  attachments: AttachmentRecord[];
  onRemove?: (id: string) => void;
}) {
  if (!attachments.length) {
    return (
      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
        No attachments selected
      </Typography>
    );
  }

  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {attachments.map((att) => (
        <Chip
          key={att.id}
          label={att.customName || att.title}
          icon={<FileText size={14} />}
          onDelete={onRemove ? () => onRemove(att.id) : undefined}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Stack>
  );
}
