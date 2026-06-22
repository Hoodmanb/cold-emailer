"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  ArrowLeft,
  Save,
  Eye,
  RotateCcw,
  Layout,
  Palette,
  Check,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import LayoutEditor from "@/components/documentBuilder/LayoutEditor";
import TemplateRenderer from "@/components/documentBuilder/TemplateRenderer"; // NEW
import { useGetSystemTemplate, SystemTemplate } from "@/hooks/queryHooks/systemTemplates";
import { DocumentTemplateType, mapDocTypeToTemplateType, TemplateBlock, TemplateLayout, TemplateStyle } from "@/types/documentTemplate";
import { useCreateDocumentTemplate } from "@/hooks/queryHooks/documentTemplates";

type BlockType = "profile" | "experience" | "education" | "skills" | "projects" | "certificates";

const AVAILABLE_BLOCKS: { id: BlockType; label: string; description: string }[] = [
  { id: "profile", label: "Profile", description: "Name, contact info, and summary" },
  { id: "experience", label: "Experience", description: "Work history and positions" },
  { id: "education", label: "Education", description: "Degrees and institutions" },
  { id: "skills", label: "Skills", description: "Technical and soft skills" },
  { id: "projects", label: "Projects", description: "Personal or professional projects" },
  { id: "certificates", label: "Certificates", description: "Certifications and credentials" },
];

const PRESET_COLORS = ["#111111", "#2563eb", "#059669", "#7c3aed", "#dc2626", "#ea580c"];

// --- Sub-components (ColorPicker, FontSizeSelector, SpacingSelector, BlockReorderPanel — same as before) ---
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [customColor, setCustomColor] = useState(value);
  return (
    <Stack gap={2}>
      <Typography variant="subtitle2" fontWeight={600}>Primary Color</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {PRESET_COLORS.map((color) => (
          <Box
            key={color}
            onClick={() => onChange(color)}
            sx={{
              width: 32, height: 32, borderRadius: 1, backgroundColor: color, cursor: "pointer",
              border: value === color ? "2px solid #000" : "2px solid transparent",
              boxShadow: value === color ? "0 0 0 2px #fff, 0 0 0 4px " + color : undefined,
              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {value === color && <Check size={16} color="#fff" />}
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
          <TextField size="small" value={customColor} onChange={(e) => setCustomColor(e.target.value)} onBlur={() => onChange(customColor)} placeholder="#hex" sx={{ width: 100 }} />
        </Box>
      </Box>
    </Stack>
  );
}

function FontSizeSelector({ value, onChange }: { value: number; onChange: (size: number) => void }) {
  const sizes = [10, 11, 12, 13, 14];
  return (
    <Stack gap={2}>
      <Typography variant="subtitle2" fontWeight={600}>Font Size</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {sizes.map((size) => (
          <Button key={size} size="small" variant={value === size ? "contained" : "outlined"} onClick={() => onChange(size)} sx={{ minWidth: 40 }}>{size}px</Button>
        ))}
      </Box>
    </Stack>
  );
}

function SpacingSelector({ value, onChange }: { value: number; onChange: (space: number) => void }) {
  const spacings = [8, 10, 12, 16, 20];
  return (
    <Stack gap={2}>
      <Typography variant="subtitle2" fontWeight={600}>Block Spacing</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {spacings.map((space) => (
          <Button key={space} size="small" variant={value === space ? "contained" : "outlined"} onClick={() => onChange(space)} sx={{ minWidth: 40 }}>{space}px</Button>
        ))}
      </Box>
    </Stack>
  );
}

function BlockReorderPanel({
  layout,
  onReorder
}: {
  layout: { type: "single-column" | "two-column"; blocks?: string[]; columns?: { width: string; blocks: string[] }[] };
  onReorder: (newLayout: typeof layout) => void;
}) {
  const [activeColumn, setActiveColumn] = useState<0 | 1>(0);

  const getBlocks = () => {
    if (layout.type === "single-column") return layout.blocks || [];
    return layout.columns?.[activeColumn]?.blocks || [];
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const blocks = [...getBlocks()];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);

    if (layout.type === "single-column") {
      onReorder({ ...layout, blocks });
    } else {
      const newColumns = [...(layout.columns || [])];
      newColumns[activeColumn] = { ...newColumns[activeColumn], blocks };
      onReorder({ ...layout, columns: newColumns });
    }
  };

  const toggleBlock = (blockId: BlockType) => {
    const blocks = getBlocks();
    const exists = blocks.includes(blockId);
    const newBlocks = exists ? blocks.filter((b) => b !== blockId) : [...blocks, blockId];

    if (layout.type === "single-column") {
      onReorder({ ...layout, blocks: newBlocks });
    } else {
      const newColumns = [...(layout.columns || [])];
      newColumns[activeColumn] = { ...newColumns[activeColumn], blocks: newBlocks };
      onReorder({ ...layout, columns: newColumns });
    }
  };

  const blocks = getBlocks();

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 4, mb: 3 }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Layout size={20} color="#7c3aed" />
        <Typography variant="subtitle1" fontWeight={800}>Content Blocks</Typography>
      </Stack>

      {layout.type === "two-column" && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button size="small" variant={activeColumn === 0 ? "contained" : "outlined"} onClick={() => setActiveColumn(0)}>
            Left Column ({layout.columns?.[0]?.width})
          </Button>
          <Button size="small" variant={activeColumn === 1 ? "contained" : "outlined"} onClick={() => setActiveColumn(1)}>
            Right Column ({layout.columns?.[1]?.width})
          </Button>
        </Box>
      )}

      <Stack gap={1}>
        {AVAILABLE_BLOCKS.map((block) => {
          const isEnabled = blocks.includes(block.id);
          const index = blocks.indexOf(block.id);
          return (
            <Paper
              key={block.id}
              elevation={0}
              sx={{
                p: 2, border: "1px solid", borderColor: isEnabled ? "primary.main" : "divider",
                borderRadius: 2, backgroundColor: isEnabled ? "action.selected" : "background.paper",
                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onClick={() => toggleBlock(block.id)}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={isEnabled ? 700 : 500}>{block.label}</Typography>
                <Typography variant="caption" color="text.secondary">{block.description}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {isEnabled && index > 0 && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveBlock(index, index - 1); }}>↑</IconButton>
                )}
                {isEnabled && index < blocks.length - 1 && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveBlock(index, index + 1); }}>↓</IconButton>
                )}
                <Chip size="small" label={isEnabled ? "On" : "Off"} color={isEnabled ? "primary" : "default"} />
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}

// --- Main Page ---
export default function TemplateBuilderPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const { template: baseTemplate, loading, error } = useGetSystemTemplate(templateId);
  const createTemplate = useCreateDocumentTemplate();

  const [name, setName] = useState("My Custom Template");
  const [layout, setLayout] = useState<TemplateLayout>({
    type: "single-column",
    blocks: ["profile", "experience", "education", "skills", "projects", "certificates"],
  });
  const [style, setStyle] = useState<TemplateStyle>({
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    primaryColor: "#111111",
    fontSize: 12,
    spacing: 12,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (baseTemplate) {
      setName(`${baseTemplate.name} (Custom)`);
      setLayout(baseTemplate.layout || {
        type: "single-column",
        blocks: ["profile", "experience", "education", "skills", "projects", "certificates"],
      });
      setStyle(baseTemplate.style || {
        fontFamily: 'Inter, "Segoe UI", sans-serif',
        primaryColor: "#111111",
        fontSize: 12,
        spacing: 12,
      });
    }
  }, [baseTemplate]);

  // Derive blocks from current layout state
  const blocks = React.useMemo((): Record<string, TemplateBlock> => {
    const allBlockIds = new Set<string>();
    if (layout.type === "single-column") {
      (layout.blocks || []).forEach((id) => allBlockIds.add(id));
    } else if (layout.columns) {
      layout.columns.forEach((col) => (col.blocks || []).forEach((id) => allBlockIds.add(id)));
    }

    const result: Record<string, TemplateBlock> = {};
    for (const id of allBlockIds) {
      const baseBlock = baseTemplate?.blocks?.[id];
      result[id] = {
        type: id,
        title: baseBlock?.title ?? id.charAt(0).toUpperCase() + id.slice(1),
        ...baseBlock,
      };
    }
    return result;
  }, [layout, baseTemplate]);

  const handleSave = useCallback(async () => {
    if (!baseTemplate) return;
    try {
      const templateData = {
        name,
        type: mapDocTypeToTemplateType(baseTemplate?.category ?? "resume") as DocumentTemplateType,
        description: `Custom template based on ${baseTemplate?.name}`,
        layout,
        blocks,
        style: style || {},
        isPublic: false,
        category: baseTemplate?.category || "resume",
      };
      await createTemplate.mutateAsync(templateData);
      setSaveSuccess(true);
      setSaveDialogOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save template");
    }
  }, [name, baseTemplate, layout, blocks, style, createTemplate]);

  const handleReset = useCallback(() => {
    if (baseTemplate) {
      setLayout(baseTemplate.layout || { type: "single-column", blocks: ["profile", "experience", "education", "skills", "projects", "certificates"] });
      setStyle(baseTemplate.style || { fontFamily: 'Inter, "Segoe UI", sans-serif', primaryColor: "#111111", fontSize: 12, spacing: 12 });
    }
  }, [baseTemplate]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Typography color="text.secondary">Loading template...</Typography>
      </Box>
    );
  }

  if (error || !baseTemplate) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || "Template not found. Please select a template from the templates page."}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button component={Link} href="/dashboard/templates" startIcon={<ArrowLeft size={16} />}>Back to Templates</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={2}>
            <Button component={Link} href="/dashboard/templates" startIcon={<ArrowLeft size={16} />}>Back</Button>
            <Typography variant="h6" fontWeight={800}>Document Builder</Typography>
            <Chip icon={<Sparkles size={14} />} label={baseTemplate.name} color="primary" variant="outlined" size="small" />
          </Stack>
          <Stack direction="row" gap={1}>
            <Tooltip title="Reset to default">
              <IconButton onClick={handleReset} color="inherit"><RotateCcw size={20} /></IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Eye size={16} />} onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button variant="contained" startIcon={<Save size={16} />} onClick={() => setSaveDialogOpen(true)}>Save Template</Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "flex", height: "calc(100% - 65px)" }}>
        {/* Left Panel */}
        <Box sx={{ width: 400, minWidth: 400, borderRight: "1px solid", borderColor: "divider", overflow: "auto", bgcolor: "background.default" }}>
          <Box sx={{ p: 3 }}>
            <LayoutEditor layout={layout || { type: "single-column" }} onChange={setLayout} />
            <BlockReorderPanel layout={layout || { type: "single-column" }} onReorder={setLayout} />
            <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
                <Palette size={20} color="#059669" />
                <Typography variant="subtitle1" fontWeight={800}>Style Settings</Typography>
              </Stack>
              <Stack gap={3}>
                <ColorPicker value={style?.primaryColor || "#111111"} onChange={(color) => setStyle((s) => ({ ...s, primaryColor: color }))} />
                <Divider />
                                <FontSizeSelector value={Number(style?.fontSize) || 12} onChange={(size) => setStyle((s) => ({ ...s, fontSize: size }))} />
                <Divider />
                <SpacingSelector value={Number(style?.spacing) || 12} onChange={(space) => setStyle((s) => ({ ...s, spacing: space }))} />
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* Right Panel - Live Preview */}
        <Box sx={{ flex: 1, overflow: "auto", p: 4, bgcolor: "#f8fafc" }}>
          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Paper elevation={2} sx={{ p: 1, borderRadius: 2, boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}>
                <Box sx={{ bgcolor: "#f1f5f9", borderRadius: 1, overflow: "hidden" }}>
                  {/* REPLACED: TemplateRenderer renders client-side from state */}
                  <TemplateRenderer
                    name={name}
                    layout={layout}
                    style={style}
                    blocks={blocks}
                  />
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block", textAlign: "center" }}>
                Live preview updates as you modify the template
              </Typography>
            </motion.div>
          </Box>
        </Box>
      </Box>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Custom Template</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Template Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">This will save a copy of this template with your custom layout and style settings.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createTemplate.isPending || !name}>
            {createTemplate.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>{name}</Typography>
          <IconButton onClick={() => setPreviewOpen(false)}><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TemplateRenderer name={name} layout={layout} style={style} blocks={blocks} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Wand2 size={16} />} onClick={() => setPreviewOpen(false)}>Use This Template</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={saveSuccess} autoHideDuration={6000} onClose={() => setSaveSuccess(false)}>
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>Template saved successfully!</Alert>
      </Snackbar>
      <Snackbar open={Boolean(saveError)} autoHideDuration={6000} onClose={() => setSaveError(null)}>
        <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>
      </Snackbar>
    </Box>
  );
}