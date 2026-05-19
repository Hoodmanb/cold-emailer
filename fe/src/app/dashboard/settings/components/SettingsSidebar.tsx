"use client";

import React from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Tabs, Tab, useTheme, useMediaQuery } from "@mui/material";
import { User, Cpu, ShieldAlert } from "lucide-react";

export type SettingsCategory = "general" | "ai" | "account";

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onSelectCategory: (category: SettingsCategory) => void;
  hasUnsavedChanges: boolean;
  onWarnUnsaved: () => boolean; // returns true if user chooses to proceed
}

export default function SettingsSidebar({
  activeCategory,
  onSelectCategory,
  hasUnsavedChanges,
  onWarnUnsaved,
}: SettingsSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const items = [
    { id: "general" as SettingsCategory, label: "General Profile", icon: User },
    { id: "ai" as SettingsCategory, label: "AI Workflows", icon: Cpu },
    { id: "account" as SettingsCategory, label: "Account & Danger", icon: ShieldAlert },
  ];

  const handleCategoryClick = (id: SettingsCategory) => {
    if (id === activeCategory) return;
    if (hasUnsavedChanges) {
      const proceed = onWarnUnsaved();
      if (!proceed) return;
    }
    onSelectCategory(id);
  };

  if (isMobile) {
    const activeIndex = items.findIndex((x) => x.id === activeCategory);
    
    return (
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeIndex !== -1 ? activeIndex : 0}
          onChange={(_, newValue) => handleCategoryClick(items[newValue].id)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Settings Categories Navigation"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              py: 1,
              px: 2,
              minWidth: "auto",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
              outline: "none",
              borderRadius: "4px 4px 0 0",
              transition: "all 0.2s ease",
              "&:hover": {
                color: "primary.main",
                bgcolor: "action.hover",
              },
              "&.Mui-focusVisible": {
                bgcolor: "action.selected",
                boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
              },
            },
          }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Tab
                key={item.id}
                label={item.label}
                icon={<Icon size={16} />}
                iconPosition="start"
                id={`settings-tab-${item.id}`}
                aria-controls={`settings-tabpanel-${item.id}`}
              />
            );
          })}
        </Tabs>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Settings Navigation"
      sx={{
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 24,
        alignSelf: "flex-start",
      }}
    >
      <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeCategory;

          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleCategoryClick(item.id)}
              selected={isActive}
              aria-current={isActive ? "page" : undefined}
              id={`settings-nav-${item.id}`}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                bgcolor: isActive ? "primary.lighter" : "transparent",
                color: isActive ? "primary.main" : "text.secondary",
                outline: "none",
                "&:hover": {
                  bgcolor: isActive ? "action.selected" : "action.hover",
                  color: "text.primary",
                },
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                  fontWeight: 700,
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
                "&.Mui-focusVisible": {
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? "primary.main" : "text.secondary",
                  transition: "color 0.2s ease",
                }}
              >
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 700 : 600,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
