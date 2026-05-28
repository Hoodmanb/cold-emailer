"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Grid, Card, CardContent, CardMedia, Typography,
  Chip, Button, Skeleton, Stack, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, IconButton, Paper,
} from "@mui/material";
import { Search, Eye, X, Layers, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSystemTemplates, SystemTemplate } from "@/hooks/queryHooks/systemTemplates";
import { useRouter } from "next/navigation";

import { getApiBaseUrl, apiUrl } from "@/config/env";

const API_URL = typeof window !== "undefined" ? getApiBaseUrl() || window.location.origin : apiUrl;

// ─── Quick Filter Labels ────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "All", value: "all" },
  { label: "Resume", value: "resume" },
  { label: "Cover Letter", value: "cover_letter" },
  { label: "Proposal", value: "proposal" },
  { label: "ATS Report", value: "ats_report" },
  { label: "Modern", value: "modern" },
  { label: "Minimal", value: "minimal" },
  { label: "Executive", value: "executive" },
];

// ─── Skeleton Card ───────────────────────────────────────────────────────────
function TemplateCardSkeleton() {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ position: "relative", paddingTop: "141%" }}>
        <Skeleton variant="rectangular" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="45%" height={16} sx={{ mt: 1 }} />
        <Stack direction="row" gap={1} mt={1.5}>
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="rounded" width={50} height={22} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Template Card ───────────────────────────────────────────────────────────
function TemplateCard({ template, onPreview }: { template: SystemTemplate; onPreview: (t: SystemTemplate) => void }) {
  const router = useRouter();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      style={{ height: "100%" }}
    >
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          transition: "border-color 0.25s, box-shadow 0.25s",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            "& .card-overlay": { opacity: 1 },
            "& .card-thumb": { transform: "scale(1.04)" },
          },
        }}
      >
        {/* Thumbnail */}
        <Box sx={{ position: "relative", paddingTop: "141%", overflow: "hidden", bgcolor: "#f1f5f9" }}>
          <CardMedia
            component="img"
            className="card-thumb"
            image={`${API_URL}${template.preview}`}
            alt={template.name}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "top",
              p: 1.5,
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
              borderRadius: 3
            }}
          />

          {/* Hover overlay */}
          <Box
            className="card-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)",
              opacity: 0,
              transition: "opacity 0.25s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              p: 2,
            }}
          >
            <Button
              variant="contained"
              size="medium"
              onClick={() => router.push(`/dashboard/documents/create?templateId=${template.id}`)}
              sx={{
                borderRadius: 8, px: 3, textTransform: "none",
                fontWeight: 700, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                width: "100%", maxWidth: 200,
              }}
            >
              Use Template
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<Eye size={16} />}
              onClick={() => onPreview(template)}
              sx={{
                borderRadius: 8, px: 3, textTransform: "none",
                fontWeight: 600, bgcolor: "rgba(255,255,255,0.92)",
                color: "text.primary", borderColor: "transparent",
                width: "100%", maxWidth: 200,
                "&:hover": { bgcolor: "white", borderColor: "transparent" },
              }}
            >
              Preview
            </Button>
          </Box>

          {template.premium && (
            <Chip
              label="PRO"
              size="small"
              color="secondary"
              sx={{ position: "absolute", top: 10, right: 10, fontWeight: 800, fontSize: "0.65rem", height: 22 }}
            />
          )}
        </Box>

        {/* Info */}
        <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.25 }}>
              {template.name}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {template.theme} · {template.category.replace("_", " ")}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1.5}>
            {template.tags.slice(0, 3).map((tag) => (
              <Typography
                key={tag}
                variant="caption"
                sx={{
                  bgcolor: "action.selected", px: 1, py: 0.4,
                  borderRadius: 1, color: "text.secondary", fontWeight: 500,
                }}
              >
                {tag}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ template, onClose }: { template: SystemTemplate | null; onClose: () => void }) {
  const router = useRouter();
  return (
    <Dialog
      open={Boolean(template)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      {template && (
        <>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{template.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {template.theme} · {template.category.replace("_", " ")}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Button
                variant="contained"
                size="small"
                onClick={() => { router.push(`/dashboard/documents/create?templateId=${template.id}`); onClose(); }}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 2.5 }}
              >
                Use Template
              </Button>
              <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: "#f1f5f9" }}>
            <Box sx={{ width: "100%", minHeight: "60vh", display: "flex", alignItems: "flex-start", justifyContent: "center", p: 3 }}>
              <motion.img
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                src={`${API_URL}${template.preview}`}
                alt={template.name}
                style={{ maxWidth: "100%", height: "auto", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              />
            </Box>
            {/* Metadata row */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {template.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ fontWeight: 500 }} />
                ))}
                {template.supports?.ats && <Chip label="ATS-Friendly" size="small" color="success" sx={{ fontWeight: 600 }} />}
              </Stack>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function DocumentTemplatesSection() {
  const { templates, loading } = useGetSystemTemplates();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<SystemTemplate | null>(null);

  const filtered = useMemo(() => {
    if (!templates) return [];
    const lower = search.toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !lower ||
        t.name.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower) ||
        t.theme.toLowerCase().includes(lower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lower));
      const matchesFilter =
        activeFilter === "all" ||
        t.category === activeFilter ||
        t.theme === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [templates, search, activeFilter]);

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={3} gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Document Templates</Typography>
          <Typography variant="body2" color="text.secondary">Browse premium, ATS-optimised templates for every document type</Typography>
        </Box>
        <TextField
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 260 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          }}
        />
      </Stack>

      {/* Filter chips */}
      <Stack direction="row" gap={1} mb={4} sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
        {QUICK_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => setActiveFilter(f.value)}
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontSize: "0.82rem",
              px: 0.5,
              py: 2.5,
              cursor: "pointer",
              transition: "all 0.18s",
              bgcolor: activeFilter === f.value ? "primary.main" : "background.paper",
              color: activeFilter === f.value ? "primary.contrastText" : "text.secondary",
              border: "1px solid",
              borderRadius: "24px",
              borderColor: activeFilter === f.value ? "primary.main" : "divider",
              "&:hover": {
                bgcolor: activeFilter === f.value ? "primary.dark" : "action.hover",
              },
            }}
          />
        ))}
      </Stack>

      {/* Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <TemplateCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 10, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 3 }}
        >
          <Layers size={48} style={{ opacity: 0.15, marginBottom: 12 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {search || activeFilter !== "all" ? "No templates match your filters" : "No templates available"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {search || activeFilter !== "all" ? "Try adjusting your search or clearing filters" : "Check back soon — more templates are on the way"}
          </Typography>
          {(search || activeFilter !== "all") && (
            <Button
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2.5, fontWeight: 600 }}
              onClick={() => { setSearch(""); setActiveFilter("all"); }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filtered.map((t) => (
              <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <TemplateCard template={t} onPreview={setPreviewTemplate} />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
    </Box>
  );
}
