"use client";

import React from "react";
import {
  Stack, Box, Typography, Chip, Tooltip
} from "@mui/material";
import { Activity, Bot, CheckCircle2, Mail, AlertCircle, Edit3, FileText, Play } from "lucide-react";
import type { AuditEntry } from "@/types";

interface AuditLogViewerProps {
  logs: AuditEntry[];
  loading?: boolean;
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  ai_generated: { icon: <Bot size={14} />, color: "#3b82f6", label: "AI Generated" },
  ai_failed: { icon: <AlertCircle size={14} />, color: "#ef4444", label: "AI Failed" },
  draft_created: { icon: <FileText size={14} />, color: "#f59e0b", label: "Draft Created" },
  draft_approved: { icon: <CheckCircle2 size={14} />, color: "#22c55e", label: "Draft Approved" },
  draft_edited: { icon: <Edit3 size={14} />, color: "#8b5cf6", label: "Manually Edited" },
  email_sent: { icon: <Mail size={14} />, color: "#06b6d4", label: "Email Sent" },
  email_failed: { icon: <AlertCircle size={14} />, color: "#ef4444", label: "Email Failed" },
  workflow_started: { icon: <Play size={14} />, color: "#6366f1", label: "Workflow Started" },
  workflow_completed: { icon: <CheckCircle2 size={14} />, color: "#22c55e", label: "Workflow Done" },
  workflow_failed: { icon: <AlertCircle size={14} />, color: "#ef4444", label: "Workflow Failed" },
};

export default function AuditLogViewer({ logs, loading }: AuditLogViewerProps) {
  if (loading) {
    return <Typography color="text.secondary" variant="body2">Loading audit log...</Typography>;
  }

  if (logs.length === 0) {
    return (
      <Stack alignItems="center" py={4} gap={1}>
        <Activity size={32} color="#d1d5db" />
        <Typography color="text.secondary" variant="body2">No audit entries yet. Generate some documents to start tracking.</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={1}>
      {logs.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || { icon: <Activity size={14} />, color: "#6b7280", label: entry.action };
        return (
          <Stack
            key={entry.id}
            direction="row"
            alignItems="flex-start"
            gap={1.5}
            sx={{
              p: 1.5,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
            }}
          >
            <Box sx={{ color: config.color, mt: 0.2, flexShrink: 0 }}>{config.icon}</Box>
            <Stack flex={1} gap={0.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color={config.color}>
                  {config.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(entry.timestamp).toLocaleString()}
                </Typography>
              </Stack>
              {entry.details && (
                <Typography variant="caption" color="text.secondary">{entry.details}</Typography>
              )}
              <Stack direction="row" gap={0.5} flexWrap="wrap" mt={0.25}>
                {entry.module && <Chip label={entry.module} size="small" sx={{ fontSize: "0.6rem", height: 16 }} />}
                {entry.model && <Chip label={entry.model.split("/")[1] || entry.model} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.6rem", height: 16 }} />}
                {entry.entityType && <Chip label={entry.entityType} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 16 }} />}
              </Stack>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
