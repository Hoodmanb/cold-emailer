"use client";

import React, { useState, useEffect } from "react";
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
  MenuItem,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import {
  X,
  Send,
  Paperclip,
  Plus,
  FileText,
  ChevronDown,
  Sparkles,
  Trash2,
  Mail,
  Users
} from "lucide-react";
import { useProductivity } from "@/context/ProductivityContext";
import { useGetRecipients, useGetDocuments } from "@/hooks/queryHooks";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

export default function SendMailModal() {
  const { activeModal, closeModal, modalData, openModal } = useProductivity();
  const isOpen = activeModal === "mail";
  const { recipient: recipients = [], loading: loadingRecipients } = useGetRecipients();
  const { documents = [], loading: loadingDocs } = useGetDocuments();
  const { showSnackbar } = useSnackbar();

  const [to, setTo] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (modalData?.attachments) {
      setAttachments(prev => [...prev, ...modalData.attachments]);
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
        attachments: attachments.map(a => a.id),
      });
      showSnackbar("Email sent successfully", "success");
      closeModal();
    } catch (err) {
      showSnackbar("Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, height: "85vh", display: "flex", flexDirection: "column" }
      }}
    >
      <DialogTitle sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.lighter", color: "success.main" }}>
            <Mail size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              Compose Email
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reach out to recruiters or clients professionally
            </Typography>
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
                placeholder="Search by name or email..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Users size={18} style={{ marginRight: 8, opacity: 0.6 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <React.Fragment>
                      {loadingRecipients ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Application for Frontend Engineer Role"
          />

          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              multiline
              rows={12}
              label="Email Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(0,0,0,0.01)"
                }
              }}
            />
            <Button
              size="small"
              variant="text"
              startIcon={<Sparkles size={14} />}
              sx={{ position: "absolute", bottom: 8, right: 8, textTransform: "none", color: "primary.main" }}
              onClick={() => openModal("assistant", { context: "Email generation" })}
            >
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
              <Autocomplete
                size="small"
                options={documents}
                getOptionLabel={(option) => option.type}
                onChange={(_, newValue) => {
                  if (newValue && !attachments.find(a => a.id === newValue.id)) {
                    setAttachments([...attachments, newValue]);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Attach Existing"
                    sx={{ width: 200 }}
                    placeholder="Search docs..."
                  />
                )}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => openModal("generator")}
              >
                Generate New
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" gap={1.5} flexWrap="wrap">
            {attachments.map((att) => (
              <Chip
                key={att.id}
                label={att.type}
                onDelete={() => removeAttachment(att.id)}
                icon={<FileText size={14} />}
                sx={{
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  py: 2
                }}
              />
            ))}
            {attachments.length === 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                No documents attached.
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end", bgcolor: "background.paper", gap: 2 }}>
        <Button onClick={closeModal} disabled={sending}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
          onClick={handleSend}
          disabled={sending || !to || !subject || !body}
          sx={{ px: 4, borderRadius: 2.5 }}
        >
          {sending ? "Sending..." : "Send Email"}
        </Button>
      </Box>
    </Dialog>
  );
}
