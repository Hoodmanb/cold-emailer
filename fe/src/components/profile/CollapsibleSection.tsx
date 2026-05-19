"use client";

import React, { useState } from "react";
import { Box, Stack, Typography, Collapse, IconButton, Badge } from "@mui/material";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@mui/material";

type CollapsibleSectionProps = {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onAdd?: () => void;
};

export function CollapsibleSection({
  title,
  count,
  children,
  defaultExpanded = false,
  onAdd,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    if (onAdd) onAdd();
  };

  return (
    <Box 
      sx={{ 
        border: "1px solid", 
        borderColor: "divider", 
        borderRadius: 3, 
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: "primary.light" }
      }}
    >
      <Box 
        component="button"
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          width: "100%",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          p: 2, 
          bgcolor: expanded ? "action.hover" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background-color 0.2s ease",
          "&:hover": { bgcolor: "action.hover" },
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" }
        }}
        aria-expanded={expanded}
      >
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">
            {title}
          </Typography>
          {count !== undefined && (
            <Box 
              sx={{ 
                px: 1, 
                py: 0.25, 
                borderRadius: 1.5, 
                bgcolor: "primary.main", 
                color: "primary.contrastText", 
                fontSize: "0.75rem", 
                fontWeight: 800 
              }}
            >
              {count}
            </Box>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}>
          {onAdd && (
            <Button
              size="small"
              startIcon={<Plus size={16} />}
              onClick={handleAddClick}
              sx={{ 
                fontWeight: 700, 
                textTransform: "none", 
                borderRadius: 2,
                px: 1.5,
                bgcolor: "action.selected",
                "&:hover": { bgcolor: "action.focus" }
              }}
            >
              Add
            </Button>
          )}
          <IconButton size="small" component="div" sx={{ color: "text.secondary" }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
