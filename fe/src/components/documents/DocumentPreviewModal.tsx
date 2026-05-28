"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogTitle, Box, Typography, IconButton,
  Button, Stack, Chip, CircularProgress, Alert,
} from "@mui/material";
import { X, Download, FileText, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import axiosInstance from "@/hooks/axios";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onDownload?: () => void;
}

const FORMAT_COLORS: Record<string, "default" | "primary" | "success" | "warning"> = {
  pdf: "primary",
  docx: "success",
  txt: "default",
};

function MarkdownPreview({ content }: { content: string }) {
  return (
    <Box
      sx={{
        p: 3,
        "& h1": { fontSize: "1.6rem", fontWeight: 800, mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "divider" },
        "& h2": { fontSize: "1.2rem", fontWeight: 700, mt: 2.5, mb: 1 },
        "& h3": { fontSize: "1rem", fontWeight: 700, mt: 2, mb: 0.75 },
        "& p": { mb: 1.2, lineHeight: 1.75 },
        "& ul, & ol": { pl: 3, mb: 1 },
        "& li": { mb: 0.5 },
        "& hr": { my: 2.5, opacity: 0.25 },
        "& strong": { fontWeight: 700 },
        "& em": { fontStyle: "italic" },
        "& a": { color: "primary.main" },
        "& code": { fontFamily: "monospace", bgcolor: "action.hover", px: 0.5, py: 0.1, borderRadius: 0.5, fontSize: "0.85em" },
        "& blockquote": { borderLeft: "3px solid", borderColor: "primary.main", pl: 2, ml: 0, color: "text.secondary", fontStyle: "italic" },
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}

function PdfPreview({ docId }: { docId: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBlobUrl(null);
    setLoadError(false);
    setLoading(true);

    axiosInstance
      .get(`/api/documents/${docId}/preview`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        prevBlobUrl.current = url;
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setLoadError(true); setLoading(false); }
      });

    return () => {
      cancelled = true;
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
    };
  }, [docId]);

  if (loadError) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={300} gap={2}>
        <AlertTriangle size={32} color="#f59e0b" />
        <Typography variant="body2" color="text.secondary">
          PDF preview unavailable. Use the Download button to view.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ position: "relative", minHeight: 500 }}>
      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0 }}>
          <CircularProgress size={28} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Rendering PDF...
          </Typography>
        </Stack>
      )}
      {blobUrl && (
        <iframe
          src={blobUrl}
          title="Document Preview"
          style={{ width: "100%", height: "68vh", border: "none" }}
        />
      )}
    </Box>
  );
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onClose,
  document,
  onDownload,
}) => {
  if (!document) return null;

  const fmt = document.exportFormat || document.format || "txt";
  const title = document.title || `${(document.type || "document").toUpperCase().replace("-", " ")} Preview`;
  const sourceContent = document.editableContent || document.content || "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, maxHeight: "92vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid", borderColor: "divider", py: 1.5, px: 3,
        }}
      >
        <Stack direction="row" gap={1.5} alignItems="center">
          <FileText size={18} />
          <Typography variant="h6" fontWeight={800} noWrap sx={{ maxWidth: 420 }}>
            {title}
          </Typography>
          <Chip
            label={fmt.toUpperCase()}
            size="small"
            color={FORMAT_COLORS[fmt] || "default"}
            variant="outlined"
            sx={{ fontWeight: 700, height: 22, fontSize: "0.7rem", flexShrink: 0 }}
          />
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          {onDownload && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Download size={14} />}
              onClick={onDownload}
              sx={{ borderRadius: 2.5, fontWeight: 700, flexShrink: 0 }}
            >
              Download
            </Button>
          )}
          <IconButton onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
            <X size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ overflowY: "auto", maxHeight: "78vh" }}>
          {fmt === "pdf" ? (
            <PdfPreview docId={document.id} />
          ) : sourceContent ? (
            <MarkdownPreview content={sourceContent} />
          ) : (
            <Stack alignItems="center" justifyContent="center" minHeight={200} gap={2} p={4}>
              <FileText size={40} style={{ opacity: 0.2 }} />
              <Typography variant="body2" color="text.secondary">No content to preview</Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
