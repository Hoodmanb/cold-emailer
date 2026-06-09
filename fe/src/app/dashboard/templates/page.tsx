"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Sparkles, Globe } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import EmailTemplatesSection from "@/components/template/EmailTemplatesSection";
import AITemplatesSection from "@/components/template/AITemplatesSection";
import CommunityTemplatesSection from "@/components/template/CommunityTemplatesSection";

const TABS = [
  { id: "email", label: "Email Templates", icon: Mail },
  { id: "ai", label: "AI Templates", icon: Sparkles },
  { id: "community", label: "Community Templates", icon: Globe },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SegmentedControl({ value, onChange }: { value: TabId; onChange: (v: TabId) => void }) {
  return (
    <Paper elevation={0} sx={{ display: "inline-flex", p: 0.75, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "action.hover", gap: 0.5, flexWrap: "wrap" }}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <Box key={id} onClick={() => onChange(id)} sx={{ position: "relative", cursor: "pointer", borderRadius: 2.5 }}>
            {active && (
              <motion.div
                layoutId="tab-indicator"
                style={{ position: "absolute", inset: 0, borderRadius: 16, background: "var(--mui-palette-background-paper)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", zIndex: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <Stack direction="row" alignItems="center" gap={1} sx={{ position: "relative", zIndex: 1, px: 1.5, py: 1, color: active ? "text.primary" : "text.secondary" }}>
              <Icon size={18} />
              <Typography variant="body2" fontWeight={active ? 700 : 500}>{label}</Typography>
            </Stack>
          </Box>
        );
      })}
    </Paper>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const resolveTab = (tab: string | null): TabId => {
    if (tab === "ai" || tab === "community" || tab === "smart") return tab === "smart" ? "ai" : tab;
    return "email";
  };
  const [activeTab, setActiveTab] = useState<TabId>(resolveTab(paramTab));

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveTab(resolveTab(paramTab));
  }, [paramTab]);

  const content = useMemo(() => {
    if (activeTab === "email") return <EmailTemplatesSection />;
    if (activeTab === "ai") return <AITemplatesSection />;
    return <CommunityTemplatesSection />;
  }, [activeTab]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={5} gap={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>Templates</Typography>
          <Typography variant="body1" color="text.secondary">
            Email campaigns, AI document templates, and community-shared designs
          </Typography>
        </Box>
        <SegmentedControl value={activeTab} onChange={handleTabChange} />
      </Stack>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {content}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
