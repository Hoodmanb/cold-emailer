"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Briefcase, Pencil, Plus, Trash2, Calendar, ExternalLink } from "lucide-react";
import type { WorkExperience } from "@/types";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

type ExperienceSectionProps = {
  experience: WorkExperience[];
  onChange: (experience: WorkExperience[]) => void;
  onSynced?: () => Promise<void>;
};

function isOk(res: { status: number; data?: { success?: boolean; message?: string } }) {
  if (res.status < 200 || res.status >= 300) return false;
  if (res.data?.success === false) return false;
  return true;
}

export interface ExperienceSectionHandle {
  openNew: () => void;
}

export const ExperienceSection = React.forwardRef<ExperienceSectionHandle, ExperienceSectionProps>(
  ({ experience, onChange, onSynced }, ref) => {
    const { showSnackbar } = useSnackbar();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState<Partial<WorkExperience>>({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      companyLinks: [],
    });

    React.useImperativeHandle(ref, () => ({
      openNew,
    }));

    const persistExperience = async (nextExperience: WorkExperience[]) => {
      setBusy(true);
      try {
        const res = await axiosInstance.put("/api/profile", { experience: nextExperience });
        if (!isOk(res)) {
          showSnackbar(res.data?.message || "Failed to save work experience", "error");
          await onSynced?.();
          return false;
        }
        await onSynced?.();
        return true;
      } catch (e) {
        console.error(e);
        showSnackbar("Failed to save work experience", "error");
        await onSynced?.();
        return false;
      } finally {
        setBusy(false);
      }
    };

    const openNew = () => {
      setForm({
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        companyLinks: [],
      });
      setEditingId(null);
      setDialogOpen(true);
    };

    const openEdit = (exp: WorkExperience) => {
      setForm({ ...exp, companyLinks: exp.companyLinks || [] });
      setEditingId(exp.id);
      setDialogOpen(true);
    };

    const handleSave = async () => {
      if (!form.title || !form.company || busy) return;

      const updatedExp = {
        ...form,
        achievements: Array.isArray(form.achievements) ? form.achievements : [],
        companyLinks: (form.companyLinks || []).filter((l) => l.url.trim()),
      };

      const nextExperience = editingId
        ? experience.map((exp) =>
            exp.id === editingId ? ({ ...exp, ...updatedExp } as WorkExperience) : exp
          )
        : [...experience, { ...updatedExp, id: uuidv4() } as WorkExperience];

      onChange(nextExperience);
      const ok = await persistExperience(nextExperience);
      if (ok) {
        showSnackbar(editingId ? "Work experience updated" : "Work experience added", "success");
        setDialogOpen(false);
      }
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Delete this work experience?") || busy) return;
      const nextExperience = experience.filter((exp) => exp.id !== id);
      onChange(nextExperience);
      const ok = await persistExperience(nextExperience);
      if (ok) {
        showSnackbar("Work experience removed", "success");
      }
    };

    const addLink = () => {
      if ((form.companyLinks || []).length >= 2) return;
      setForm({
        ...form,
        companyLinks: [...(form.companyLinks || []), { label: "", url: "" }],
      });
    };

    const updateLink = (index: number, field: "label" | "url", value: string) => {
      const nextLinks = [...(form.companyLinks || [])];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      setForm({ ...form, companyLinks: nextLinks });
    };

    const removeLink = (index: number) => {
      setForm({
        ...form,
        companyLinks: (form.companyLinks || []).filter((_, i) => i !== index),
      });
    };

    return (
      <Stack gap={2}>
        {experience.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic", textAlign: "center", py: 4, bgcolor: "action.hover", borderRadius: 3 }}
          >
            No work experience added yet. Click "Add" above to start.
          </Typography>
        ) : (
          <Stack gap={2}>
            {experience.map((exp) => (
              <Card key={exp.id} variant="outlined" sx={{ p: 2.5, borderRadius: 4, position: "relative" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" gap={2} sx={{ flex: 1 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "primary.lighter", height: "fit-content" }}>
                      <Briefcase size={22} color="#3b82f6" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {exp.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>
                        {exp.company}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                        <Calendar size={14} color="#94a3b8" />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                        </Typography>
                      </Stack>

                      {/* Company Links on Card */}
                      {exp.companyLinks && exp.companyLinks.length > 0 && (
                        <Stack direction="row" gap={1.5} sx={{ mt: 1.5 }}>
                          {exp.companyLinks.map((link, idx) => (
                            <Box
                              key={idx}
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "primary.main",
                                textDecoration: "none",
                                bgcolor: "primary.lighter",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1.5,
                                transition: "all 0.2s",
                                "&:hover": { bgcolor: "primary.main", color: "white" },
                              }}
                            >
                              <ExternalLink size={12} />
                              {link.label || "Website"}
                            </Box>
                          ))}
                        </Stack>
                      )}

                      {exp.description && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 1.5, color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                        >
                          {exp.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" gap={0.5}>
                    <IconButton size="small" onClick={() => openEdit(exp)} sx={{ borderRadius: 2 }} disabled={busy}>
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(exp.id)} sx={{ borderRadius: 2 }} disabled={busy}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 5 } }}
        >
          <DialogTitle fontWeight={900}>{editingId ? "Edit Experience" : "Add Experience"}</DialogTitle>
          <DialogContent>
            <Stack gap={2.5} sx={{ mt: 1.5 }}>
              <TextField
                label="Job Title"
                fullWidth
                required
                size="small"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <TextField
                label="Company Name"
                fullWidth
                required
                size="small"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <Stack direction="row" gap={2}>
                <TextField
                  label="Start Date"
                  fullWidth
                  size="small"
                  placeholder="e.g. Jan 2020"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
                {!form.current && (
                  <TextField
                    label="End Date"
                    fullWidth
                    size="small"
                    placeholder="e.g. Dec 2022"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    InputProps={{ sx: { borderRadius: 2.5 } }}
                  />
                )}
              </Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.current}
                    onChange={(e) => setForm({ ...form, current: e.target.checked })}
                    sx={{ color: "primary.main" }}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    I currently work here
                  </Typography>
                }
              />

              <Divider sx={{ my: 1 }} />

              {/* Company Links Section */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                    Company Links (Max 2)
                  </Typography>
                  {(form.companyLinks || []).length < 2 && (
                    <Button
                      size="small"
                      startIcon={<Plus size={14} />}
                      onClick={addLink}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                      Add link
                    </Button>
                  )}
                </Stack>
                <Stack gap={1.5}>
                  {(form.companyLinks || []).map((link, idx) => (
                    <Stack key={idx} direction="row" gap={1} alignItems="flex-start">
                      <TextField
                        label="Label (optional)"
                        size="small"
                        placeholder="e.g. Portfolio"
                        value={link.label}
                        onChange={(e) => updateLink(idx, "label", e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                      <TextField
                        label="URL (required)"
                        size="small"
                        required
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => updateLink(idx, "url", e.target.value)}
                        sx={{ flex: 2 }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                      <IconButton color="error" onClick={() => removeLink(idx)} sx={{ mt: 0.5 }}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <TextField
                label="Job Description"
                fullWidth
                multiline
                rows={4}
                placeholder="Key responsibilities and achievements..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!form.title || !form.company || busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ borderRadius: 2.5, fontWeight: 700, px: 3 }}
            >
              {busy ? "Saving..." : "Save Experience"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }
);

ExperienceSection.displayName = "ExperienceSection";
