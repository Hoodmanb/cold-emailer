import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { X, Download, Mail } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onDownload?: () => void;
  onMail?: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onClose,
  document,
  onDownload,
  onMail,
}) => {
  if (!document) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={800}>
          {document.type.toUpperCase().replace("-", " ")} Preview
        </Typography>
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4, maxHeight: "70vh", overflowY: "auto" }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <Box className="markdown-content">
              <ReactMarkdown>{document.content}</ReactMarkdown>
            </Box>
          </Paper>
        </Box>
        <Divider />
        <Stack direction="row" justifyContent="flex-end" gap={2} sx={{ p: 2, bgcolor: "action.hover" }}>
          <Button variant="outlined" onClick={onClose}>Close</Button>
          {onMail && (
            <Button variant="outlined" startIcon={<Mail />} onClick={onMail}>
              Email
            </Button>
          )}
          {onDownload && (
            <Button variant="contained" startIcon={<Download />} onClick={onDownload}>
              Download
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
