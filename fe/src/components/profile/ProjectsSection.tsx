"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FolderKanban, Pencil, Plus, Trash2, Eye, Github, ExternalLink, Play, Image as ImageIcon } from "lucide-react";
import type { ProfileProject } from "@/types";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/queryHooks";
import { DynamicInputRow } from "@/components/profile/DynamicInputRow";

type Draft = {
  id: string;
  title: string;
  summary: string;
  description: string;
  technologies: string;
  github: string;
  live: string;
  demoVideos: string[];
  screenshots: { type: "upload" | "url"; value: string; preview: string }[];
};

const emptyDraft = (): Draft => ({
  id: "",
  title: "",
  summary: "",
  description: "",
  technologies: "",
  github: "",
  live: "",
  demoVideos: [""],
  screenshots: [],
});

const isValidUrl = (value: string) => {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_err) {
    return false;
  }
};

const videoEmbed = (url: string) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/i);
  if (vi?.[1]) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
};

export interface ProjectsSectionHandle {
  openNew: () => void;
}

export const ProjectsSection = React.forwardRef<ProjectsSectionHandle>((_, ref) => {
  const { data: projects = [] } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { showSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProfileProject | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  React.useImperativeHandle(ref, () => ({
    openNew,
  }));

  const openNew = () => {
    setDraft(emptyDraft());
    setValidationError(null);
    setDialogOpen(true);
  };

  const openEdit = (p: ProfileProject) => {
    setDraft({
      id: p.id,
      title: p.title,
      summary: p.summary,
      description: p.description || "",
      technologies: (p.technologies || []).join(", "),
      github: p.links?.github || "",
      live: p.links?.live || "",
      demoVideos: p.demoVideos?.length ? p.demoVideos : [""],
      screenshots: (p.screenshots || []).map((s) => ({ ...s, preview: s.value })),
    });
    setValidationError(null);
    setDialogOpen(true);
  };

  const openView = (p: ProfileProject) => {
    setSelectedProject(p);
    setViewDialogOpen(true);
  };

  const uploadScreenshot = async (file: File) => {
    const fd = new FormData();
    fd.append("screenshot", file);
    const res = await axiosInstance.post("/api/profile/projects/media/screenshot", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
      throw new Error(res.data?.message || "Unable to upload screenshot");
    }
    return String(res.data?.data?.value || "");
  };

  const saveDialog = async () => {
    const title = draft.title.trim();
    const summary = draft.summary.trim();
    if (!title || !summary) {
      setValidationError("Project title and summary are required.");
      return;
    }
    const demoVideos = draft.demoVideos.map((v) => v.trim()).filter(Boolean);
    if (demoVideos.length > 2) {
      setValidationError("Maximum of 2 demo videos allowed.");
      return;
    }
    if (demoVideos.some((v) => !isValidUrl(v))) {
      setValidationError("Please provide a valid video URL.");
      return;
    }
    if (draft.screenshots.length > 2) {
      setValidationError("Maximum of 2 screenshots allowed.");
      return;
    }
    if (draft.screenshots.some((s) => s.type === "url" && !isValidUrl(s.value))) {
      setValidationError("Please provide a valid screenshot URL.");
      return;
    }

    const payload = {
      title,
      summary,
      description: draft.description.trim(),
      technologies: draft.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      links: { github: draft.github.trim(), live: draft.live.trim() },
      demoVideos,
      screenshots: draft.screenshots.map((s) => ({ type: s.type, value: s.value })),
    };

    try {
      if (draft.id) {
        await updateProject.mutateAsync({ id: draft.id, payload });
        showSnackbar("Project updated successfully", "success");
      } else {
        await createProject.mutateAsync(payload);
        showSnackbar("Project created successfully", "success");
      }
      setDialogOpen(false);
      setDraft(emptyDraft());
      setValidationError(null);
    } catch (err: any) {
      showSnackbar(err?.message || "Unable to save project", "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject.mutateAsync(id);
      showSnackbar("Project deleted successfully", "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Unable to delete project", "error");
    }
  };

  const addVideoField = () => {
    if (draft.demoVideos.length >= 2) {
      setValidationError("Maximum of 2 demo videos allowed.");
      return;
    }
    setDraft((prev) => ({ ...prev, demoVideos: [...prev.demoVideos, ""] }));
  };

  const removeVideoField = (index: number) => {
    setDraft((prev) => {
      const next = prev.demoVideos.filter((_, i) => i !== index);
      return {
        ...prev,
        demoVideos: next.length ? next : [""],
      };
    });
  };

  const addScreenshotUrl = () => {
    if (draft.screenshots.length >= 2) {
      setValidationError("Maximum of 2 screenshots allowed.");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, { type: "url", value: "", preview: "" }],
    }));
  };

  const removeScreenshotField = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  const addScreenshotUpload = async (file: File | null) => {
    if (!file) return;
    if (draft.screenshots.length >= 2) {
      setValidationError("Maximum of 2 screenshots allowed.");
      return;
    }
    try {
      const full = await uploadScreenshot(file);
      setDraft((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, { type: "upload", value: full, preview: full }],
      }));
      showSnackbar("Screenshot uploaded successfully", "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Unable to upload screenshot", "error");
    }
  };

  const generateSummary = async (project: ProfileProject) => {
    setAiLoadingId(project.id);
    try {
      const prompt = `Generate a concise project summary for this project.\nTitle: ${project.title}\nDescription: ${project.description || project.summary}\nTechnologies: ${(project.technologies || []).join(", ")}`;
      const res = await axiosInstance.post("/api/settings/ai/feature-generate", {
        featureId: "project_summary_generation",
        prompt,
      });
      if (res.data?.success && res.data?.data) {
        await updateProject.mutateAsync({
          id: project.id,
          payload: { ...project, summary: String(res.data.data).trim() },
        });
        showSnackbar("Project summary generated", "success");
      } else {
        showSnackbar(res.data?.error || res.data?.message || "Failed to generate summary", "error");
      }
    } catch (_err) {
      showSnackbar("Failed to generate summary", "error");
    } finally {
      setAiLoadingId(null);
    }
  };

  const isSubmitting = createProject.isPending || updateProject.isPending || deleteProject.isPending;

  return (
    <Stack gap={3}>
      {/* Projects List */}
      {projects.length === 0 ? (
        <Box sx={{
          py: 8,
          px: 2,
          borderRadius: 4,
          border: "2px dashed",
          borderColor: "divider",
          textAlign: "center",
          bgcolor: "action.hover"
        }}>
          <FolderKanban size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No projects yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: "auto", mb: 3 }}>
            Add your best work to showcase your skills and experience to potential employers.
          </Typography>
        </Box>
      ) : (
        <Stack gap={2.5}>
          {projects.map((p) => (
            <Card
              key={p.id}
              variant="outlined"
              sx={{
                borderRadius: 4,
                transition: "all 0.2s ease-in-out",
                "&:hover": { boxShadow: 4, borderColor: "primary.light" },
                overflow: "visible"
              }}
            >
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                  {/* Content Area */}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, color: "text.primary" }}>{p.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>{p.summary}</Typography>

                    <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 2 }}>
                      {(p.technologies || []).map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            borderRadius: "6px",
                            bgcolor: "action.selected",
                            border: "none"
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Actions Area */}
                  <Stack direction={{ xs: "row", sm: "column" }} gap={1} alignItems={{ xs: "center", sm: "flex-end" }} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void generateSummary(p)}
                      disabled={aiLoadingId === p.id || isSubmitting}
                      sx={{
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        textTransform: "none",
                        whiteSpace: "nowrap",
                        flex: { xs: 1, sm: "none" }
                      }}
                    >
                      {aiLoadingId === p.id ? "Analyzing..." : "AI Sync"}
                    </Button>
                    <Stack direction="row" gap={0.5}>
                      <IconButton
                        aria-label="View project"
                        onClick={() => openView(p)}
                        size="small"
                        sx={{ bgcolor: "primary.lighter", color: "primary.main", borderRadius: "8px" }}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        aria-label="Edit project"
                        onClick={() => openEdit(p)}
                        size="small"
                        sx={{ bgcolor: "action.hover", borderRadius: "8px" }}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete project"
                        onClick={() => void remove(p.id)}
                        size="small"
                        color="error"
                        sx={{ bgcolor: "error.lighter", borderRadius: "8px", "&:hover": { bgcolor: "error.light", color: "white" } }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5 } }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 4 }, pb: 1 }}>
          <Typography variant="h5" fontWeight={800}>{draft.id ? "Edit project" : "New project"}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>PROJECT DETAILS & MEDIA</Typography>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 4 } }}>
          <Stack gap={3} sx={{ pt: 2 }}>
            {validationError ? <Alert severity="error" sx={{ borderRadius: 3 }}>{validationError}</Alert> : null}

            {/* Basic Info Group */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, ml: 0.5, opacity: 0.8 }}>Basic Info</Typography>
              <Stack gap={2}>
                <TextField label="Project title" required size="small" fullWidth value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                <TextField label="Summary" required size="small" fullWidth multiline minRows={2} value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} />
                <TextField label="Full description" size="small" fullWidth multiline minRows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
                <TextField label="Technologies (comma-separated)" size="small" fullWidth value={draft.technologies} onChange={(e) => setDraft((d) => ({ ...d, technologies: e.target.value }))} />
              </Stack>
            </Box>

            {/* Links Group */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, ml: 0.5, opacity: 0.8 }}>Links</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                <TextField label="GitHub URL" size="small" fullWidth value={draft.github} onChange={(e) => setDraft((d) => ({ ...d, github: e.target.value }))} />
                <TextField label="Live URL" size="small" fullWidth value={draft.live} onChange={(e) => setDraft((d) => ({ ...d, live: e.target.value }))} />
              </Stack>
            </Box>

            <Divider sx={{ opacity: 0.5 }} />

            {/* Media Group */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, ml: 0.5, opacity: 0.8 }}>Media (Max 2 each)</Typography>

              {/* Videos */}
              <Stack gap={1.5} sx={{ mb: 3 }}>
                {draft.demoVideos.map((v, i) => (
                  <DynamicInputRow
                    key={`video-${i}`}
                    label={`Demo video URL ${i + 1}`}
                    value={v}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        demoVideos: prev.demoVideos.map((item, idx) => (idx === i ? value : item)),
                      }))
                    }
                    onDelete={() => removeVideoField(i)}
                    disabledDelete={draft.demoVideos.length <= 1}
                  />
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={addVideoField}
                  disabled={draft.demoVideos.length >= 2}
                  sx={{ alignSelf: "flex-start", borderRadius: 2, fontWeight: 700 }}
                >
                  Add video link
                </Button>
              </Stack>

              {/* Screenshots */}
              <Stack gap={2}>
                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    disabled={draft.screenshots.length >= 2}
                    sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
                  >
                    Upload screenshot
                    <input type="file" accept="image/*" hidden onChange={(e) => void addScreenshotUpload(e.target.files?.[0] || null)} />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={addScreenshotUrl}
                    disabled={draft.screenshots.length >= 2}
                    sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
                  >
                    Screenshot URL
                  </Button>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={2}>
                  {draft.screenshots.map((s, i) => (
                    <Box key={`s-${i}`} sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                      {s.type === "url" ? (
                        <TextField
                          label={`Screenshot URL ${i + 1}`}
                          size="small"
                          fullWidth
                          value={s.value}
                          sx={{ mb: 1 }}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              screenshots: prev.screenshots.map((item, idx) =>
                                idx === i ? { ...item, value: e.target.value, preview: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      ) : null}
                      {s.preview ? (
                        <Box sx={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16/10", border: "1px solid", borderColor: "divider" }}>
                          <Box component="img" src={s.preview} alt={`screenshot-${i}`} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <IconButton
                            aria-label={`Delete screenshot ${i + 1}`}
                            color="error"
                            onClick={() => removeScreenshotField(i)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(255,255,255,0.9)",
                              "&:hover": { bgcolor: "error.main", color: "white" }
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 4 }, pt: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void saveDialog()}
            disabled={isSubmitting}
            sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
          >
            {isSubmitting ? "Saving..." : "Save Project"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "scroll" } }}
      >
        {selectedProject && (
          <Box>
            <Box sx={{ p: 4, bgcolor: "primary.main", color: "white" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 800, letterSpacing: 1.5 }}>PROJECT DETAILS</Typography>
                  <Typography variant="h4" fontWeight={900}>{selectedProject.title}</Typography>
                </Box>
                <IconButton onClick={() => setViewDialogOpen(false)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                  <Plus size={24} style={{ transform: "rotate(45deg)" }} />
                </IconButton>
              </Stack>
            </Box>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 4 }}>
                <Stack gap={4}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} gutterBottom color="primary.main">Summary</Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>{selectedProject.summary}</Typography>
                  </Box>

                  {selectedProject.description && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} gutterBottom color="primary.main">Detailed Description</Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {selectedProject.description}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} gutterBottom color="primary.main">Technologies</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {selectedProject.technologies.map((t) => (
                        <Chip key={t} label={t} sx={{ fontWeight: 700, borderRadius: 2, bgcolor: "action.hover" }} />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} gutterBottom color="primary.main">Links</Typography>
                    <Stack direction="row" gap={2}>
                      {selectedProject.links?.github && (
                        <Button component="a" href={selectedProject.links.github} target="_blank" variant="outlined" startIcon={<Github size={18} />} sx={{ borderRadius: 2, fontWeight: 700 }}>GitHub</Button>
                      )}
                      {selectedProject.links?.live && (
                        <Button component="a" href={selectedProject.links.live} target="_blank" variant="contained" startIcon={<ExternalLink size={18} />} sx={{ borderRadius: 2, fontWeight: 700 }}>Live Demo</Button>
                      )}
                    </Stack>
                  </Box>

                  {/* Media Section */}
                  {(selectedProject.demoVideos?.length || selectedProject.screenshots?.length) ? (
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} gutterBottom color="primary.main">Media Showcase</Typography>
                      <Stack direction="row" gap={2} flexWrap="wrap">
                        {selectedProject.demoVideos?.map((v, i) => {
                          const embed = videoEmbed(v);
                          return embed ? (
                            <Box key={i} sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" }, aspectRatio: "16/9", borderRadius: 3, overflow: "hidden", bgcolor: "black", boxShadow: 3 }}>
                              <Box component="iframe" src={embed} sx={{ width: "100%", height: "100%", border: 0 }} />
                            </Box>
                          ) : null;
                        })}
                        {selectedProject.screenshots?.map((s, i) => (
                          <Box key={i} sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" }, aspectRatio: "16/10", borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", boxShadow: 3 }}>
                            <Box component="img" src={s.value} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}

                  {selectedProject.contentMd && (
                    <Box sx={{ p: 3, borderRadius: 4, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: "block", mb: 2, textTransform: "uppercase" }}>Markdown Content / AI Context</Typography>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", color: "text.secondary" }}>{selectedProject.contentMd}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </DialogContent>
            <Box sx={{ p: 3, bgcolor: "action.hover", borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setViewDialogOpen(false)} variant="contained" sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>Close View</Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Stack>
  );
});

ProjectsSection.displayName = "ProjectsSection";
