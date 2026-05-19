"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, FileText } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import EmailTemplatesSection from "@/components/template/EmailTemplatesSection";
import DocumentTemplatesSection from "@/components/template/DocumentTemplatesSection";

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "email", label: "Email Templates", icon: Mail },
  { id: "document", label: "Document Templates", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Premium Segmented Control ────────────────────────────────────────────────
function SegmentedControl({
  value,
  onChange,
}: {
  value: TabId;
  onChange: (v: TabId) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "inline-flex",
        p: 0.75,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
        gap: 0.5,
      }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <Box
            key={id}
            onClick={() => onChange(id)}
            sx={{ position: "relative", cursor: "pointer", borderRadius: 2.5 }}
          >
            {/* Animated sliding indicator */}
            {active && (
              <motion.div
                layoutId="tab-indicator"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  background: "var(--mui-palette-background-paper)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  zIndex: 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{
                position: "relative",
                zIndex: 1,
                px: 1,
                py: 1,
                borderRadius: 2.5,
                transition: "color 0.2s",
                color: active ? "text.primary" : "text.secondary",
                userSelect: "none",
              }}
            >
              <Icon size={"20px"} />
              <Typography
                variant="body2"
                fontWeight={active ? 700 : 500}
                sx={{ whiteSpace: "nowrap", transition: "font-weight 0.2s" }}
              >
                {label}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive active tab from ?tab= query param, default to "email"
  const paramTab = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    paramTab === "document" ? "document" : "email"
  );

  // Keep URL in sync when tab changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sync if user navigates directly with ?tab=
  useEffect(() => {
    if (paramTab === "document" || paramTab === "email") {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* Page Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={5}
        gap={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: "-0.5px" }}>
            Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your creative workspace for email campaigns and document designs
          </Typography>
        </Box>

        <SegmentedControl value={activeTab} onChange={handleTabChange} />
      </Stack>

      {/* Animated Content */}
      <AnimatePresence mode="wait">
        {activeTab === "email" ? (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <EmailTemplatesSection />
          </motion.div>
        ) : (
          <motion.div
            key="document"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <DocumentTemplatesSection />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
