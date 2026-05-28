"use client";

import React, { useState } from "react";
import {
  Box, Container, Typography, Stack, Tabs, Tab, Button, Chip, Paper,
} from "@mui/material";
import { LayoutTemplate, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import TemplateSelector from "@/components/templates/TemplateSelector";
import { usePublicDocumentTemplates } from "@/hooks/queryHooks/documentTemplates";
import { TEMPLATE_TYPE_LABELS, type DocumentTemplateType } from "@/types/documentTemplate";
import { useProductivity } from "@/context/ProductivityContext";

const TYPE_TABS: { value: DocumentTemplateType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "resume", label: "Resume" },
  { value: "cv", label: "Professional CV" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "email", label: "Email" },
];

function mapTemplateTypeToDocType(type: DocumentTemplateType): string {
  if (type === "cv") return "professional-cv";
  if (type === "cover_letter") return "cover-letter";
  return type;
}

export default function TemplatesMarketplacePage() {
  const router = useRouter();
  const { openModal } = useProductivity();
  const [typeFilter, setTypeFilter] = useState<DocumentTemplateType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; type: DocumentTemplateType } | null>(null);

  const queryType = typeFilter === "all" ? undefined : typeFilter;
  const { data } = usePublicDocumentTemplates(queryType);
  const count = data?.templates?.length || 0;

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    const docType = mapTemplateTypeToDocType(selectedTemplate.type);
    openModal("generator", { docType, templateId: selectedTemplate.id, preselect: true });
    router.push("/dashboard");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} mb={4}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <LayoutTemplate size={24} />
              <Typography variant="h4" fontWeight={900}>Template Marketplace</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Browse public document templates. Star favorites and use them when generating documents.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => router.push("/dashboard/templates")}>
            Manage My Templates
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
          <Tabs
            value={typeFilter}
            onChange={(_, v) => setTypeFilter(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TYPE_TABS.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {count} public template{count !== 1 ? "s" : ""} available
          </Typography>
        </Paper>

        <TemplateSelector
          documentType={typeFilter === "all" ? undefined : mapTemplateTypeToDocType(typeFilter as DocumentTemplateType)}
          value={selectedId}
          onChange={(id, template) => {
            setSelectedId(id);
            if (template) {
              setSelectedTemplate({ id: template.id, type: template.type });
            } else {
              setSelectedTemplate(null);
            }
          }}
          showTypeFilter
        />

        {selectedTemplate && (
          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip label={TEMPLATE_TYPE_LABELS[selectedTemplate.type]} size="small" color="primary" variant="outlined" />
              <Typography variant="body2" color="text.secondary">Ready to generate with this template</Typography>
            </Stack>
            <Button variant="contained" startIcon={<Sparkles size={16} />} onClick={handleUseTemplate}>
              Use Template
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
