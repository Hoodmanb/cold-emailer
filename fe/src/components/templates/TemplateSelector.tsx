"use client";

import React, { useMemo, useState } from "react";
import {
  Box, Typography, Grid, Card, CardActionArea, CardContent, Chip, Stack,
  IconButton, Tabs, Tab, CircularProgress, Alert,
} from "@mui/material";
import { Star, LayoutTemplate } from "lucide-react";
import {
  useDocumentTemplates,
  useStarDocumentTemplate,
  useUnstarDocumentTemplate,
} from "@/hooks/queryHooks/documentTemplates";
import type { DocumentTemplate, DocumentTemplateType } from "@/types/documentTemplate";
import { TEMPLATE_TYPE_LABELS, isTemplateUsableInGeneration, deriveStructureFromLayout } from "@/types/documentTemplate";

interface TemplateSelectorProps {
  /** Filter templates by document type (resume, professional-cv, cover-letter, email) */
  documentType?: string;
  /** Currently selected template id, or null for default */
  value: string | null;
  onChange: (templateId: string | null, template?: DocumentTemplate | null) => void;
  /** Compact mode for inline panels */
  compact?: boolean;
  /** Show type filter tabs */
  showTypeFilter?: boolean;
}

export default function TemplateSelector({
  documentType,
  value,
  onChange,
  compact = false,
  showTypeFilter = false,
}: TemplateSelectorProps) {
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const filterType = documentType === "professional-cv" ? "cv"
    : documentType === "cover-letter" ? "cover_letter"
    : documentType || undefined;

  const { data, isLoading, error } = useDocumentTemplates(filterType as DocumentTemplateType | undefined);
  const starMutation = useStarDocumentTemplate();
  const unstarMutation = useUnstarDocumentTemplate();

  const templates = (data?.templates || []).filter(isTemplateUsableInGeneration);
  const starredIds = new Set(data?.starredIds || []);

  const displayed = useMemo(() => {
    if (tab === "favorites") {
      return templates.filter((t) => starredIds.has(t.id));
    }
    return templates;
  }, [tab, templates, starredIds]);

  const toggleStar = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (starredIds.has(templateId)) {
      unstarMutation.mutate(templateId);
    } else {
      starMutation.mutate(templateId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        Could not load templates. You can still generate without one.
      </Alert>
    );
  }

  return (
    <Box>
      {showTypeFilter && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 36 }}>
          <Tab label="All Templates" value="all" sx={{ minHeight: 36, py: 0.5 }} />
          <Tab label="Favorites" value="favorites" sx={{ minHeight: 36, py: 0.5 }} />
        </Tabs>
      )}

      <Grid container spacing={compact ? 1.5 : 2}>
        <Grid size={{ xs: 12, sm: 6, md: compact ? 6 : 4 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: value === null ? "primary.main" : "divider",
              bgcolor: value === null ? "primary.50" : "background.paper",
              height: "100%",
            }}
          >
            <CardActionArea onClick={() => onChange(null, null)} sx={{ height: "100%" }}>
              <CardContent sx={{ p: compact ? 1.5 : 2 }}>
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                  <LayoutTemplate size={16} />
                  <Typography variant="subtitle2" fontWeight={800}>No template (default)</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Use the standard AI generation flow without template constraints.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {displayed.map((template) => (
          <Grid size={{ xs: 12, sm: 6, md: compact ? 6 : 4 }} key={template.id}>
            <TemplateCard
              template={template}
              selected={value === template.id}
              starred={starredIds.has(template.id)}
              compact={compact}
              onSelect={() => onChange(template.id, template)}
              onToggleStar={(e) => toggleStar(e, template.id)}
            />
          </Grid>
        ))}
      </Grid>

      {tab === "favorites" && displayed.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: "italic" }}>
          No starred templates yet. Star templates for quick access.
        </Typography>
      )}
    </Box>
  );
}

function TemplateCard({
  template,
  selected,
  starred,
  compact,
  onSelect,
  onToggleStar,
}: {
  template: DocumentTemplate;
  selected: boolean;
  starred: boolean;
  compact?: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
}) {
  const structure = template.structure ?? deriveStructureFromLayout(template.layout, template.blocks);
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.50" : "background.paper",
        height: "100%",
        position: "relative",
      }}
    >
      <IconButton
        size="small"
        onClick={onToggleStar}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 2,
          color: starred ? "warning.main" : "action.disabled",
        }}
        aria-label={starred ? "Unstar template" : "Star template"}
      >
        <Star size={16} fill={starred ? "currentColor" : "none"} />
      </IconButton>
      <CardActionArea onClick={onSelect} sx={{ height: "100%" }}>
        <CardContent sx={{ p: compact ? 1.5 : 2, pr: 5 }}>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            {template.name}
          </Typography>
          <Chip
            label={TEMPLATE_TYPE_LABELS[template.type] || template.type}
            size="small"
            variant="outlined"
            sx={{ mb: 1, fontSize: "0.65rem", height: 20 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {template.preview || template.aiRules?.slice(0, 80) || "Structured document template"}
          </Typography>
          {structure.length > 0 && (
            <Stack direction="row" gap={0.5} flexWrap="wrap">
              {structure.slice(0, 3).map((section) => (
                <Chip key={section} label={section} size="small" sx={{ fontSize: "0.6rem", height: 18 }} />
              ))}
              {structure.length > 3 && (
                <Chip label={`+${structure.length - 3}`} size="small" sx={{ fontSize: "0.6rem", height: 18 }} />
              )}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export { TemplateSelector };
