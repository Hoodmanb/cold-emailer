"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { X, Send, Paperclip, Sparkles, Mail, Users, Plus } from "lucide-react";
import { useProductivity } from "@/context/ProductivityContext";
import { useGetRecipients } from "@/hooks/queryHooks";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import AttachmentPicker, { AttachmentPreviewList, type AttachmentRecord } from "@/components/attachments/AttachmentPicker";

const MAIL_DRAFT_PARENT = "mail-widget-draft";

export default function SendMailModal() {
  const { activeModal, closeModal, modalData, openModal } = useProductivity();
  const isOpen = activeModal === "mail";
  const { recipient: recipients = [], loading: loadingRecipients } = useGetRecipients();
  const { showSnackbar } = useSnackbar();

  const [to, setTo] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTo(null);
      setSubject("");
      setBody("");
      setAttachments([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (modalData?.attachments) {
      setAttachments((prev) => [...prev, ...modalData.attachments]);
    }
  }, [modalData]);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      showSnackbar("Please fill in all required fields", "warning");
      return;
    }

    setSending(true);
    try {
      await axiosInstance.post("/api/email/send", {
        to: to.email,
        subject,
        body,
        attachments: attachments.map((a) => a.sourceDocumentId),
        documentIds: attachments.map((a) => a.sourceDocumentId),
      });
      showSnackbar("Email sent successfully", "success");
      closeModal();
    } catch {
      showSnackbar("Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  const removeAttachment = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/attachment/${id}`);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showSnackbar("Failed to remove attachment", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, height: "85vh", display: "flex", flexDirection: "column" } }}>
        <DialogTitle sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}><Mail size={24} /></Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>Compose Email</Typography>
              <Typography variant="caption" color="text.secondary">Reach out professionally with attachments</Typography>
            </Box>
          </Stack>
          <IconButton onClick={closeModal}><X /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <Stack gap={2} mt="30px">
            <Autocomplete
              options={recipients}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={to}
              onChange={(_, newValue) => setTo(newValue)}
              loading={loadingRecipients}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Recipient"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Users size={18} style={{ marginRight: 8, opacity: 0.6 }} />,
                    endAdornment: loadingRecipients ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                  }}
                />
              )}
            />
            <TextField fullWidth label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Box sx={{ position: "relative" }}>
              <TextField fullWidth multiline rows={12} label="Email Body" value={body} onChange={(e) => setBody(e.target.value)} />
              <Button size="small" variant="text" startIcon={<Sparkles size={14} />} sx={{ position: "absolute", bottom: 8, right: 8 }} onClick={() => openModal("assistant", { context: "Email generation" })}>
                AI Assist
              </Button>
            </Box>
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight={800} display="flex" alignItems="center" gap={1}>
                <Paperclip size={18} /> ATTACHMENTS ({attachments.length})
              </Typography>
              <Stack direction="row" gap={1}>
                <Button variant="outlined" size="small" startIcon={<Plus size={16} />} onClick={() => setPickerOpen(true)}>
                  Attach Documents
                </Button>
                <Button variant="outlined" size="small" onClick={() => openModal("generator")}>Generate New</Button>
              </Stack>
            </Stack>
            <AttachmentPreviewList attachments={attachments} onRemove={(id) => void removeAttachment(id)} />
          </Box>
        </DialogContent>

        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={closeModal} disabled={sending}>Cancel</Button>
          <Button variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />} onClick={() => void handleSend()} disabled={sending || !to || !subject || !body}>
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </Box>
      </Dialog>

      <AttachmentPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        parentId={MAIL_DRAFT_PARENT}
        parentType="mail_widget"
        selected={attachments}
        onChange={setAttachments}
      />
    </>
  );
}
