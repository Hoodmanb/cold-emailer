"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogTitle, Typography, IconButton,
  Button, Stack, Chip, Box, CircularProgress, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { X, Save, Download } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import { downloadAuthenticatedFile } from "@/utils/downloadUtils";
import type { DocumentFormat } from "@/types";
import axiosInstance from "@/hooks/axios";

interface DocumentEditModalProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onSave: (id: string, updates: any) => Promise<void>;
  autoSave?: boolean;
}

const FORMAT_COLORS: Record<string, "default" | "primary" | "success" | "warning"> = {
  pdf: "primary",
  docx: "success",
  txt: "default",
};

function getDocContent(doc: any): string {
  return doc?.editableContent || doc?.content || "";
}

const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  open,
  onClose,
  document,
  onSave,
  autoSave = true,
}) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [exportFormat, setExportFormat] = useState<DocumentFormat>("pdf");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (document) {
      setContent(getDocContent(document));
      setExportFormat((document.exportFormat || document.format || "pdf") as DocumentFormat);
      setDirty(false);
      setLastSaved(null);
    }
  }, [document]);

  const persist = useCallback(async (isAuto = false) => {
    if (!document?.id) return;
    if (isAuto) setAutoSaving(true);
    else setSaving(true);
    try {
      await onSave(document.id, { editableContent: content, content });
      setDirty(false);
      setLastSaved(new Date());
    } finally {
      if (isAuto) setAutoSaving(false);
      else setSaving(false);
    }
  }, [content, document?.id, onSave]);

  useEffect(() => {
    if (!autoSave || !dirty || !open) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { void persist(true); }, 2500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [autoSave, content, dirty, open, persist]);

  const handleContentChange = (v: string) => {
    setContent(v);
    setDirty(true);
  };

  const handleSave = async () => {
    await persist(false);
  };

  const handleDownload = async (format?: DocumentFormat) => {
    setDownloading(true);
    try {
      const fmt = format || exportFormat;
      const label = (document.title || document.type).replace(/[^a-z0-9]/gi, "_").toLowerCase();
      await downloadAuthenticatedFile(`/api/documents/${document.id}/download`, `${label}.${fmt}`, fmt);
    } finally {
      setDownloading(false);
    }
  };

  const handleExportAs = async () => {
    setExporting(true);
    try {
      await axiosInstance.post(`/api/documents/${document.id}/export`, { format: exportFormat }, { responseType: "blob" });
      const label = (document.title || document.type).replace(/[^a-z0-9]/gi, "_").toLowerCase();
      await downloadAuthenticatedFile(`/api/documents/${document.id}/download`, `${label}.${exportFormat}`, exportFormat);
    } finally {
      setExporting(false);
    }
  };

  if (!document) return null;

  const fmt = document.exportFormat || document.format || "txt";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, height: "92vh", display: "flex", flexDirection: "column" } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider", py: 1.5, px: 3, flexShrink: 0 }}>
        <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight={800}>
            {document.title || `Edit ${(document.type || "").toUpperCase().replace("-", " ")}`}
          </Typography>
          <Chip label={(fmt as string).toUpperCase()} size="small" color={FORMAT_COLORS[fmt] || "default"} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: "0.7rem" }} />
          {dirty && <Chip label="Unsaved" size="small" color="warning" sx={{ fontWeight: 700, height: 22, fontSize: "0.7rem" }} />}
          {autoSaving && <Chip label="Auto-saving..." size="small" color="info" sx={{ height: 22, fontSize: "0.65rem" }} />}
          {!dirty && lastSaved && <Chip label={`Saved ${lastSaved.toLocaleTimeString()}`} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.65rem" }} />}
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel sx={{ fontSize: "0.75rem" }}>Export</InputLabel>
            <Select
              value={exportFormat}
              label="Export"
              onChange={(e) => setExportFormat(e.target.value as DocumentFormat)}
              sx={{ fontSize: "0.8rem", borderRadius: 2 }}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="docx">DOCX</MenuItem>
              <MenuItem value="txt">TXT</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" disabled={exporting || saving} onClick={handleExportAs} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {exporting ? "..." : "Export"}
          </Button>
          <Button size="small" variant="outlined" startIcon={downloading ? <CircularProgress size={12} /> : <Download size={14} />} onClick={() => handleDownload()} disabled={downloading || saving} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Download
          </Button>
          <IconButton onClick={onClose} disabled={saving} size="small"><X size={18} /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <MarkdownEditor value={content} onChange={handleContentChange} minRows={24} />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            Edits are saved as the source document. Exports are generated on demand.
          </Typography>
          <Stack direction="row" gap={1.5}>
            <Button variant="outlined" onClick={onClose} disabled={saving} sx={{ borderRadius: 2.5 }}>
              {dirty ? "Close" : "Done"}
            </Button>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />} onClick={handleSave} disabled={saving || !dirty} sx={{ borderRadius: 2.5, fontWeight: 700, minWidth: 130 }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentEditModal;
