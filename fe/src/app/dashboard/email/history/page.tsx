"use client";

import React, { useState } from "react";
import { Stack, Typography, CircularProgress, Chip, Box } from "@mui/material";
import { useGetEmailHistory, useApproveEmail } from "@/hooks/queryHooks";
import EmailScoreCard from "@/components/layout/EmailScoreCard";
import DraftBadge from "@/components/layout/DraftBadge";
import { Mail, Target } from "lucide-react";
import { useSnackbar } from "@/context/SnackbarContext";

export default function EmailHistoryPage() {
  const { emails, loading, refetch } = useGetEmailHistory();
  const { approve } = useApproveEmail();
  const { showSnackbar } = useSnackbar();

  const [filter, setFilter] = useState<string>("all");

  const filteredEmails = emails?.filter(e => filter === "all" ? true : e.status === filter) || [];

  const handleApprove = async (id: string) => {
    try {
      await approve(id);
      showSnackbar("Email approved successfully", "success");
      refetch();
    } catch {
      showSnackbar("Failed to approve email", "error");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Stack gap={4} maxWidth={1000} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Stack>
          <Typography variant="h4" fontWeight={800}>Email History & Drafts</Typography>
          <Typography variant="subtitle1" color="text.secondary">Review, approve, and track your cold emails.</Typography>
        </Stack>
      </Stack>

      <Stack direction="row" gap={1}>
        {["all", "draft", "approved", "sent", "failed"].map(f => (
          <Chip
            key={f}
            label={f.toUpperCase()}
            onClick={() => setFilter(f)}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            sx={{ fontWeight: 600, borderRadius: "16px" }}
          />
        ))}
      </Stack>

      {filteredEmails.length === 0 ? (
        <Stack alignItems="center" py={10} bgcolor="background.paper" borderRadius={4} border="1px dashed #e5e7eb">
          <Mail size={48} color="#d1d5db" />
          <Typography color="text.secondary" mt={2}>No emails found for this filter.</Typography>
        </Stack>
      ) : (
        <Stack gap={3}>
          {filteredEmails.map(email => (
            <Stack key={email.id} gap={2} p={3} bgcolor="background.paper" borderRadius={4} border="1px solid" borderColor={email.status === 'draft' ? 'warning.main' : 'divider'} boxShadow="0 1px 3px rgba(0,0,0,0.05)">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap={2} alignItems="center">
                  <Stack direction="row" gap={0.5} alignItems="center">
                    <Target size={16} color="#6b7280" />
                    <Typography variant="subtitle1" fontWeight={700}>{email.to || "No recipient specified"}</Typography>
                  </Stack>
                  <DraftBadge status={email.status} />
                </Stack>
                {email.status === "draft" && (
                  <Chip label="Approve & Send" color="success" onClick={() => handleApprove(email.id)} sx={{ cursor: "pointer", fontWeight: 700 }} />
                )}
              </Stack>

              <Box bgcolor="rgba(255,255,255,0.02)" p={2} borderRadius={2} border="1px solid" borderColor="divider">
                <Typography variant="body2" fontWeight={700} mb={1}>Subject: {email.subject}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.85rem" }}>
                  {email.body}
                </Typography>
              </Box>

              <EmailScoreCard scores={email.scores} />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
