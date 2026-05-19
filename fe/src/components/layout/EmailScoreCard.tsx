"use client";

import React from "react";
import { Stack, Box, Typography, LinearProgress, Tooltip } from "@mui/material";
import { Mail, Target, MessageSquare } from "lucide-react";
import type { EmailScores } from "@/types";

interface EmailScoreCardProps {
  scores: EmailScores;
}

const ScoreBar = ({
  label,
  value,
  icon,
  tooltip,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tooltip: string;
}) => {
  const color = value >= 70 ? "success" : value >= 40 ? "warning" : "error";

  return (
    <Tooltip title={tooltip} arrow>
      <Stack gap={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" gap={0.5}>
            {icon}
            <Typography variant="caption" fontWeight={600}>
              {label}
            </Typography>
          </Stack>
          <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
            {value}/100
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={value}
          color={color as any}
          sx={{ height: 6, borderRadius: 4 }}
        />
      </Stack>
    </Tooltip>
  );
};

export default function EmailScoreCard({ scores }: EmailScoreCardProps) {
  const overall = scores.overall ?? Math.round((scores.personalization + scores.relevance + scores.tone) / 3);

  return (
    <Stack
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        bgcolor: "background.paper",
        gap: 1.5,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={700}>
          Email Quality Scores
        </Typography>
        <Typography variant="h6" fontWeight={800} color={overall >= 70 ? "success.main" : overall >= 40 ? "warning.main" : "error.main"}>
          {overall}
        </Typography>
      </Stack>

      <ScoreBar
        label="Personalization"
        value={scores.personalization}
        icon={<Target size={12} />}
        tooltip="How personalized the email is to the company/recipient"
      />
      <ScoreBar
        label="Relevance"
        value={scores.relevance}
        icon={<Mail size={12} />}
        tooltip="How well the email matches the job and your profile"
      />
      <ScoreBar
        label="Tone"
        value={scores.tone}
        icon={<MessageSquare size={12} />}
        tooltip="Professional tone analysis â€” confidence vs desperation"
      />
    </Stack>
  );
}
