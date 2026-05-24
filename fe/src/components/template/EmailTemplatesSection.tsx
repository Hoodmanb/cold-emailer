"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  Paper,
  Skeleton,
} from "@mui/material";
import {
  Eye,
  EyeOff,
  Pen,
  Trash2,
  Link2,
  Mail,
  Plus,
  Download,
  FileText,
  FileDigit,
  FileCode,
  FileType2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalModal } from "@/components/ui/Modal";
import { useSnackbar } from "@/context/SnackbarContext";
import { useFetchAttachment } from "@/hooks/queryHooks";
import { useGetTemplates } from "@/hooks/queryHooks/templates";
import AddEmailTemplate from "@/components/layout/AddEmailTemplate";
import AddAttachment from "@/components/layout/AddAttachment";
import axiosInstance from "@/hooks/axios";
import useAuthStore from "@/store/useAuthStore";

type EmailTemplate = {
  _id: string;
  name: string;
  subject: string;
  body: string;
  isPublic: boolean;
  url?: string;
};
type Attachment = {
  _id: string;
  name: string;
  url?: string;
  isPublic: boolean;
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText size={18} />;
  if (ext === "doc" || ext === "docx") return <FileDigit size={18} />;
  if (ext === "xls" || ext === "xlsx") return <FileCode size={18} />;
  return <FileType2 size={18} />;
};

function EmailCard({
  tpl,
  setRefresh,
}: {
  tpl: EmailTemplate;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [open, setOpen] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { showModal } = useGlobalModal();

  const del = async () => {
    if (!window.confirm("Delete this template?")) return;
    try {
      const res = await axiosInstance.delete(`/api/template/${tpl._id}`);
      if (res.status === 200) {
        showSnackbar("Template deleted", "success");
        setRefresh((p) => !p);
      } else showSnackbar(res.data.message || "Delete failed", "error");
    } catch {
      showSnackbar("Server error", "error");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: open ? "primary.main" : "divider",
          borderRadius: 3,
          overflow: "hidden",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
        }}
      >
        <Box
          onClick={() => setOpen((p) => !p)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 2,
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "primary.lighter",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <Mail size={18} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={700} noWrap>
              {tpl.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {tpl.subject}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" gap={1} flexShrink={0}>
            <Chip
              size="small"
              icon={tpl.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
              label={tpl.isPublic ? "Public" : "Private"}
              color={tpl.isPublic ? "success" : "default"}
              sx={{ fontSize: "0.7rem", fontWeight: 600 }}
            />
            <Box
              sx={{
                color: "text.secondary",
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "none",
              }}
            >
              ▾
            </Box>
          </Stack>
        </Box>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box
            sx={{
              px: 3,
              pb: 3,
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                bgcolor: "background.paper",
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: 160,
                overflowY: "auto",
                color: "text.secondary",
              }}
            >
              {tpl.body}
            </Typography>
            {tpl.url && (
              <Stack direction="row" alignItems="center" gap={0.5} mb={2}>
                <Link2
                  size={13}
                  style={{ color: "var(--mui-palette-primary-main)" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "primary.main", wordBreak: "break-all" }}
                >
                  {tpl.url}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" gap={1}>
              <Button
                size="small"
                startIcon={<Pen size={14} />}
                variant="outlined"
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                onClick={() =>
                  showModal(
                    <AddEmailTemplate
                      type="update"
                      templateId={tpl._id}
                      setRefresh={setRefresh}
                    />,
                  )
                }
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<Trash2 size={14} />}
                variant="outlined"
                color="error"
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                onClick={del}
              >
                Delete
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
}

function AttachmentCard({
  file,
  setRefresh,
}: {
  file: Attachment;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { showSnackbar } = useSnackbar();
  const del = async () => {
    try {
      const res = await axiosInstance.delete(`/api/attachment/${file._id}`);
      if (res.data.message === "deleted successfully") {
        showSnackbar("Attachment deleted", "success");
        setRefresh((p) => !p);
      } else showSnackbar(res.data.message || "Delete failed", "error");
    } catch {
      showSnackbar("Error deleting attachment", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          minWidth: 180,
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
        }}
      >
        <Box sx={{ color: "primary.main" }}>{getFileIcon(file.name)}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={file.name}>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </Typography>
          </Tooltip>
          <Chip
            size="small"
            label={file.isPublic ? "Public" : "Private"}
            color={file.isPublic ? "success" : "default"}
            sx={{ mt: 0.5, fontSize: "0.6rem", height: 18 }}
          />
        </Box>
        <Stack direction="row" gap={0.5}>
          {file.url && (
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={() => window.open(file.url, "_blank")}
              >
                <Download size={14} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" onClick={del}>
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
    </motion.div>
  );
}

export default function EmailTemplatesSection() {
  const { showModal } = useGlobalModal();
  const user = useAuthStore((state) => state.userProfile?.name);
  const [refresh, setRefresh] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { template, loading, error, refetch } = useGetTemplates();
  const { attachment, loadingFetch, refetchAttachment } =
    useFetchAttachment("/api/attachment");

  useEffect(() => {
    if (user) {
      refetch();
      refetchAttachment();
    }
    setMounted(true);
  }, [refresh]);

  if (!mounted) return null;

  const templates: EmailTemplate[] = Array.isArray(template) ? template : [];
  const attachments: Attachment[] = Array.isArray(attachment) ? attachment : [];

  return (
    <Box>
      {/* Email Templates */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Email Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reusable templates for your outreach campaigns
          </Typography>
        </Box>
        {templates.length !== 0 && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              fontWeight: 600,
              minHeight: 44,
            }}
            onClick={() =>
              showModal(<AddEmailTemplate type="add" setRefresh={setRefresh} />)
            }
          >
            Create Template
          </Button>
        )}
      </Stack>

      {loading ? (
        <Stack gap={2} mb={4}>
          {[1, 2, 3].map((i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 2,
              }}
            >
              <Stack direction="row" gap={2} alignItems="center">
                <Skeleton variant="rounded" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="40%" height={20} />
                  <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton width={60} height={24} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : templates.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Mail size={48} style={{ opacity: 0.18, marginBottom: 12 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No email templates yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first template to personalise your campaigns
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              fontWeight: 600,
              minHeight: 44,
            }}
            onClick={() =>
              showModal(<AddEmailTemplate type="add" setRefresh={setRefresh} />)
            }
          >
            Create First Template
          </Button>
        </Paper>
      ) : (
        <Stack gap={2} mb={4}>
          <AnimatePresence>
            {templates.map((t) => (
              <EmailCard key={t._id} tpl={t} setRefresh={setRefresh} />
            ))}
          </AnimatePresence>
        </Stack>
      )}

      {/* Attachments */}
      <Box sx={{ mt: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Attachments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              CVs and documents attached to your emails
            </Typography>
          </Box>
          {attachments.length !== 0 && (
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                fontWeight: 600,
                minHeight: 44,
              }}
              onClick={() =>
                showModal(<AddAttachment type="add" setRefresh={setRefresh} />)
              }
            >
              Upload Attachment
            </Button>
          )}
        </Stack>

        {loadingFetch ? (
          <Stack direction="row" flexWrap="wrap" gap={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={200} height={72} />
            ))}
          </Stack>
        ) : attachments.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No attachments uploaded yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                fontWeight: 600,
                minHeight: 44,
              }}
              onClick={() =>
                showModal(<AddAttachment type="add" setRefresh={setRefresh} />)
              }
            >
              Upload First Attachment
            </Button>
          </Paper>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <AnimatePresence>
              {attachments.map((file) => (
                <AttachmentCard
                  key={file._id}
                  file={file}
                  setRefresh={setRefresh}
                />
              ))}
            </AnimatePresence>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
