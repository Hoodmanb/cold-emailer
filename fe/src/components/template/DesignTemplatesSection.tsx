"use client";

import React, { useState } from "react";
import {
  Box, Typography, Stack, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { Plus, Sparkles } from "lucide-react";
import TemplateSelector from "@/components/templates/TemplateSelector";
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useDeleteDocumentTemplate,
} from "@/hooks/queryHooks/documentTemplates";
import { useProductivity } from "@/context/ProductivityContext";
import { TEMPLATE_TYPE_LABELS, type DocumentTemplateType } from "@/types/documentTemplate";
import { useSnackbar } from "@/context/SnackbarContext";

const TYPE_OPTIONS: DocumentTemplateType[] = ["resume", "cv", "cover_letter", "email"];

function mapTemplateTypeToDocType(type: DocumentTemplateType): string {
  if (type === "cv") return "professional-cv";
  if (type === "cover_letter") return "cover-letter";
  return type;
}

export default function DesignTemplatesSection() {
  const { openModal } = useProductivity();
  const { showSnackbar } = useSnackbar();
  const { data, refetch } = useDocumentTemplates();
  const createMutation = useCreateDocumentTemplate();
  const deleteMutation = useDeleteDocumentTemplate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "resume" as DocumentTemplateType,
    structure: "Header\nSummary\nExperience\nSkills",
    aiRules: "",
    isPublic: false,
  });

  const selected = data?.templates.find((t) => t.id === selectedId);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      showSnackbar("Template name is required", "warning");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        type: form.type,
        structure: form.structure.split("\n").map((s) => s.trim()).filter(Boolean),
        style: {},
        aiRules: form.aiRules.trim(),
        isPublic: form.isPublic,
      });
      showSnackbar("Template created", "success");
      setCreateOpen(false);
      setForm({ name: "", type: "resume", structure: "Header\nSummary\nExperience\nSkills", aiRules: "", isPublic: false });
      refetch();
    } catch {
      showSnackbar("Failed to create template", "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      showSnackbar("Template deleted", "success");
      setSelectedId(null);
      refetch();
    } catch {
      showSnackbar("Failed to delete template (you can only delete your own templates)", "error");
    }
  };

  const handleUse = () => {
    if (!selected) return;
    openModal("generator", {
      docType: mapTemplateTypeToDocType(selected.type),
      templateId: selected.id,
      preselect: true,
    });
  };

  return (
    <Stack gap={3}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>AI Design Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Structured templates that guide AI document generation. Star favorites for quick access.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" href="/templates">Browse Marketplace</Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Template
          </Button>
        </Stack>
      </Stack>

      <TemplateSelector
        value={selectedId}
        onChange={(id) => setSelectedId(id)}
        showTypeFilter
      />

      {selected && (
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="contained" startIcon={<Sparkles size={16} />} onClick={handleUse}>
            Use Template
          </Button>
          <Button variant="outlined" color="error" onClick={handleDelete} disabled={deleteMutation.isPending}>
            Delete
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
            {TEMPLATE_TYPE_LABELS[selected.type]} · {selected.structure.length} sections
          </Typography>
        </Stack>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Design Template</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentTemplateType })}>
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>{TEMPLATE_TYPE_LABELS[t]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Structure (one section per line)"
              value={form.structure}
              onChange={(e) => setForm({ ...form, structure: e.target.value })}
              multiline
              minRows={4}
              fullWidth
            />
            <TextField
              label="AI Rules"
              value={form.aiRules}
              onChange={(e) => setForm({ ...form, aiRules: e.target.value })}
              multiline
              minRows={3}
              fullWidth
              placeholder="e.g. Use quantified bullets, ATS-friendly headings..."
            />
            <FormControlLabel
              control={<Switch checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />}
              label="Make public (visible in marketplace)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createMutation.isPending}>Create</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
