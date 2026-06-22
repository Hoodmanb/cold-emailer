"use client";

import React, { useState } from "react";
import {
  Box, Stack, Typography, Button, Paper, Skeleton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
} from "@mui/material";
import { Check, X, Clock, Eye } from "lucide-react";
import {
  usePendingDocumentTemplates,
  useApproveDocumentTemplate,
  useRejectDocumentTemplate,
} from "@/hooks/queryHooks/documentTemplates";
import TemplateBadges from "@/components/template/TemplateBadges";
import TemplatePreview from "@/components/template/TemplatePreview";
import { useSnackbar } from "@/context/SnackbarContext";
import useAuthStore from "@/store/useAuthStore";

export default function PendingApprovalQueue() {
  const { user } = useAuthStore();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const { showSnackbar } = useSnackbar();
  const { data, isLoading, refetch } = usePendingDocumentTemplates();
  const approveMutation = useApproveDocumentTemplate();
  const rejectMutation = useRejectDocumentTemplate();

  const [rejectingTemplate, setRejectingTemplate] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const pending = data?.templates || [];

  if (isLoading) {
    return <Skeleton variant="rounded" height={120} />;
  }

  if (!pending.length) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Clock size={18} />
          <Typography fontWeight={600}>Approval Queue</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mt={1}>
          No templates awaiting approval.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "warning.main", borderRadius: 3, bgcolor: "warning.lighter" }}>
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <Clock size={18} />
          <Typography fontWeight={700}>Approval Queue</Typography>
          <Chip size="small" label={pending.length} color="warning" />
        </Stack>

        <Stack gap={1.5}>
          {pending.map((tpl) => (
            <Paper key={tpl.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography fontWeight={700}>{tpl.name}</Typography>
                  <TemplateBadges template={tpl} />
                </Box>

                <Stack direction="row" gap={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Eye size={14} />}
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    Preview
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        startIcon={<Check size={14} />}
                        onClick={async () => {
                          try {
                            await approveMutation.mutateAsync(tpl.id);
                            showSnackbar("Template approved", "success");
                            refetch();
                          } catch {
                            showSnackbar("Approval failed", "error");
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<X size={14} />}
                        onClick={() => {
                          setRejectingTemplate(tpl);
                          setRejectionReason("");
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={Boolean(rejectingTemplate)} onClose={() => setRejectingTemplate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please specify why template "{rejectingTemplate?.name}" is being rejected.
          </Typography>
          <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            multiline
            minRows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingTemplate(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={rejectMutation.isPending}
            onClick={async () => {
              if (!rejectingTemplate) return;
              try {
                await rejectMutation.mutateAsync({ id: rejectingTemplate.id, reason: rejectionReason });
                showSnackbar("Template rejected", "info");
                setRejectingTemplate(null);
                refetch();
              } catch {
                showSnackbar("Rejection failed", "error");
              }
            }}
          >
            Submit Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="md" fullWidth>
        {previewTemplate && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontWeight={700}>Preview: {previewTemplate.name}</Typography>
              <IconButton onClick={() => setPreviewTemplate(null)} size="small">
                <X size={18} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <TemplatePreview
                url={`/api/document-templates/${previewTemplate.id}/preview.html`}
                title={previewTemplate.name}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}