"use client";

import React, { useMemo, useState } from "react";
import {
  Box, Stack, Typography, Button, Paper, TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, IconButton, Skeleton,
} from "@mui/material";
import { Plus, Search, Trash2, X, Globe } from "lucide-react";
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useDeleteDocumentTemplate,
  useApproveDocumentTemplate,
  useRejectDocumentTemplate,
} from "@/hooks/queryHooks/documentTemplates";
import TemplateBadges from "@/components/template/TemplateBadges";
import TemplateStatusBadge from "@/components/template/TemplateStatusBadge";
import PlaceholderHighlight, { PlaceholderPreview } from "@/components/template/PlaceholderEditor";
import TemplatePreview from "@/components/template/TemplatePreview";
import { useSnackbar } from "@/context/SnackbarContext";
import useAuthStore from "@/store/useAuthStore";
import type { DocumentTemplate, DocumentTemplateType } from "@/types/documentTemplate";

const PLACEHOLDER_HINT = "Use placeholders like {{name}}, {{company}}, {{role}}, {{experience}}";

export default function CommunityTemplatesSection() {
  const { showSnackbar } = useSnackbar();
  const userId = useAuthStore((s) => s.userProfile?.id);
  const { data, isLoading, refetch } = useDocumentTemplates();
  const createMutation = useCreateDocumentTemplate();
  const deleteMutation = useDeleteDocumentTemplate();
  const approveMutation = useApproveDocumentTemplate();
  const rejectMutation = useRejectDocumentTemplate();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [preview, setPreview] = useState<DocumentTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "resume" as DocumentTemplateType,
    content: "",
    aiRules: "",
    templateKind: "placeholder" as "ai" | "placeholder" | "hybrid",
    category: "general",
    isPublic: false,
  });

  // Helper to filter only approved templates
  const onlyApproved = (templates: DocumentTemplate[]) =>
    templates.filter((t) => t.approvalStatus === "approved");

  // Filter out pending approval templates for community view
  const templates = useMemo(() => {
    const all = data?.templates || [];
    const q = search.toLowerCase();
    const filtered = all.filter((t) =>
      (!q || t.name.toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q))
    );
    return onlyApproved(filtered);
  }, [data, search]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      showSnackbar("Template name is required", "warning");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        type: form.type,
        content: form.content,
        aiRules: form.aiRules,
        templateKind: form.templateKind,
        category: form.category,
        structure: form.content.split("\n").map((s) => s.trim()).filter(Boolean),
        style: {},
        isPublic: form.isPublic,
      });
      showSnackbar(form.isPublic ? "Template submitted for approval" : "Template created", "success");
      setCreateOpen(false);
      refetch();
    } catch {
      showSnackbar("Failed to create template", "error");
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={3} gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Community Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and share templates with placeholder support and moderation
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
          />
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Create Template
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Stack gap={2}>{[1, 2, 3].map((i) => <Skeleton key={i} height={100} />)}</Stack>
      ) : templates.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Globe size={40} style={{ opacity: 0.2 }} />
          <Typography mt={2}>No community templates yet</Typography>
        </Paper>
      ) : (
        <Stack gap={2}>
          {templates.map((tpl) => (
            <Paper key={tpl.id} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography fontWeight={700}>{tpl.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{tpl.category} · v{tpl.version || 1}</Typography>
                  <Box mt={1}><TemplateBadges template={tpl} /></Box>
                </Box>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button size="small" variant="outlined" onClick={() => setPreview(tpl)}>Preview</Button>
                  {String(tpl.createdBy) === String(userId) && (
                    <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={() => deleteMutation.mutate(tpl.id)}>
                      Delete
                    </Button>
                  )}
                  {tpl.approvalStatus === "pending_approval" && (
                    <>
                      <Button size="small" color="success" onClick={() => approveMutation.mutate(tpl.id)}>Approve</Button>
                      <Button size="small" color="warning" onClick={() => rejectMutation.mutate({ id: tpl.id })}>Reject</Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Community Template</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentTemplateType })}>
              {["resume", "cv", "cover_letter", "email"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Template Kind" value={form.templateKind} onChange={(e) => setForm({ ...form, templateKind: e.target.value as typeof form.templateKind })}>
              <MenuItem value="placeholder">Placeholder</MenuItem>
              <MenuItem value="ai">AI</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </TextField>
            <TextField
              label="Content"
              multiline
              minRows={8}
              helperText={PLACEHOLDER_HINT}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <PlaceholderPreview content={form.content} />
            <PlaceholderHighlight value={form.content} />
            <TextField label="AI Rules (optional)" multiline minRows={3} value={form.aiRules} onChange={(e) => setForm({ ...form, aiRules: e.target.value })} />
            <Chip
              label={form.isPublic ? "Public (requires approval)" : "Private draft"}
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              color={form.isPublic ? "warning" : "default"}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreate()}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        {preview && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              {preview.name}
              <IconButton onClick={() => setPreview(null)}><X /></IconButton>
            </DialogTitle>
            <DialogContent>
              <TemplatePreview
                url={`/api/document-templates/${preview.id}/preview?page=1`}
                title={preview.name}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
