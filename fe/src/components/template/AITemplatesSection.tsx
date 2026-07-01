"use client";

import React, { useMemo, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, Skeleton, Stack,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, IconButton, Paper,
} from "@mui/material";
import { Search, Eye, X, Sparkles, Layout, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSystemTemplates, SystemTemplate } from "@/hooks/queryHooks/systemTemplates";
import TemplatePreview from "@/components/template/TemplatePreview";
import TemplateBadges from "@/components/template/TemplateBadges";
import { useProductivity } from "@/context/ProductivityContext";
import { useRouter } from "next/navigation";

function AITemplateCard({ template, onPreview }: { template: SystemTemplate; onPreview: (t: SystemTemplate) => void }) {
  const { openModal } = useProductivity();
  const router = useRouter();
  return (
    <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack gap={1.5}>
          <TemplateBadges template={{ templateKind: "ai", isPublic: false, featured: template.premium }} />
          <Typography variant="h6" fontWeight={700}>{template.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {template.theme ?? "General"} · {(template.category ?? "").replace("_", " ")}
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button size="small" variant="outlined" startIcon={<Eye size={14} />} onClick={() => onPreview(template)}>
              Preview
            </Button>
            <Button size="small" variant="contained" startIcon={<Wand2 size={14} />} onClick={() => openModal("generator", { templateId: template.id })}>
              Use Template
            </Button>
            <Button size="small" variant="outlined" color="secondary" startIcon={<Layout size={14} />} onClick={() => router.push(`/dashboard/templates/builder?mode=fork&templateId=${template.id}&source=system`)}>
              Customize
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AITemplatesSection() {
  const { templates, loading } = useGetSystemTemplates();
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<SystemTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (templates || []).filter((t) =>
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.theme?.toLowerCase().includes(q),
    );
  }, [templates, search]);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" mb={3} gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>AI Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            System templates used by AI to generate professional documents
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search AI templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
        />
      </Stack>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={180} /></Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Sparkles size={40} style={{ opacity: 0.2 }} />
          <Typography mt={2}>No AI templates match your search</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filtered.map((t) => (
              <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }} component={motion.div} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <AITemplateCard template={t} onPreview={setPreviewTemplate} />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="md" fullWidth>
        {previewTemplate && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={700}>{previewTemplate.name}</Typography>
              <IconButton onClick={() => setPreviewTemplate(null)}><X /></IconButton>
            </DialogTitle>
            <DialogContent>
              <TemplatePreview url={previewTemplate.preview} title={previewTemplate.name} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}