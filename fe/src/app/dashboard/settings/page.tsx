"use client";

import React, { useState, useCallback } from "react";
import { Container, Stack, Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import SettingsSidebar, { SettingsCategory } from "./components/SettingsSidebar";
import GeneralSettings from "./components/GeneralSettings";
import AISettings from "./components/AISettings";
import DangerZone from "./components/DangerZone";

export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");

  // Dirty indicators
  const [isDirtyGeneral, setIsDirtyGeneral] = useState(false);
  const [isDirtyAI, setIsDirtyAI] = useState(false);

  // Form drafts preserved in parent to prevent remount data loss
  const [generalDraft, setGeneralDraft] = useState<any>(null);
  const [aiDrafts, setAiDrafts] = useState<{
    keysForm?: any;
    featuresForm?: any;
  }>({
    keysForm: undefined,
    featuresForm: undefined,
  });

  const hasUnsavedChanges = isDirtyGeneral || isDirtyAI;

  // Handles confirmation warning
  const handleWarnUnsaved = useCallback(() => {
    if (hasUnsavedChanges) {
      return window.confirm(
        "You have unsaved changes in your active form. Are you sure you want to navigate away and discard these edits?"
      );
    }
    return true;
  }, [hasUnsavedChanges]);

  // Success resets
  const handleGeneralDirtyChange = useCallback((isDirty: boolean) => {
    setIsDirtyGeneral(isDirty);
  }, []);

  const handleAIDirtyChange = useCallback((isDirty: boolean) => {
    setIsDirtyAI(isDirty);
  }, []);

  const handleUpdateGeneralDraft = useCallback((draft: any) => {
    setGeneralDraft(draft);
  }, []);

  const handleUpdateAIDrafts = useCallback((drafts: any) => {
    setAiDrafts(drafts);
  }, []);

  const renderActiveCategoryContent = () => {
    switch (activeCategory) {
      case "general":
        return (
          <GeneralSettings
            onDirtyChange={handleGeneralDirtyChange}
            initialDraft={generalDraft}
            onUpdateDraft={handleUpdateGeneralDraft}
          />
        );
      case "ai":
        return (
          <AISettings
            onDirtyChange={handleAIDirtyChange}
            initialDrafts={aiDrafts}
            onUpdateDrafts={handleUpdateAIDrafts}
          />
        );
      case "account":
        return <DangerZone />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Search Engine Optimization Headings Structure */}
      <Box sx={{ mb: 4 }} id="settings-heading-container">
        <Typography
          variant="h4"
          component="h1"
          fontWeight={850}
          gutterBottom
          sx={{
            letterSpacing: "-0.025em",
            fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
          }}
        >
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your career profile, AI model key workflows, and account security preferences.
        </Typography>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 0, md: 4 }}
        alignItems="flex-start"
        sx={{ minHeight: "65vh" }}
      >
        {/* Responsive left category sidebar / horizontal mobile tabs */}
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          hasUnsavedChanges={hasUnsavedChanges}
          onWarnUnsaved={handleWarnUnsaved}
        />

        {/* Content Pane */}
        <Box sx={{ flexGrow: 1, width: "100%", overflow: "visible" }} id="settings-content-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              style={{ width: "100%" }}
            >
              {renderActiveCategoryContent()}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Stack>
    </Container>
  );
}
