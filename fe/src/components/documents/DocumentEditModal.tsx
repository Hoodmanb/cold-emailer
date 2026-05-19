import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  TextField,
  Divider,
} from "@mui/material";
import { X, Save } from "lucide-react";

interface DocumentEditModalProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onSave: (id: string, updates: any) => Promise<void>;
}

const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  open,
  onClose,
  document,
  onSave,
}) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setContent(document.content);
    }
  }, [document]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(document.id, { content });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={800}>
          Edit Document
        </Typography>
        <IconButton onClick={onClose} disabled={saving}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={15}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{ mt: 1 }}
          placeholder="Edit document content (Markdown supported)..."
        />
        <Stack direction="row" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            loading={saving}
          >
            Save Changes
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentEditModal;
