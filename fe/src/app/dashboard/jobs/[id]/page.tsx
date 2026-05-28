"use client";

import React from "react";
import { Stack, Typography, CircularProgress, Box, Chip, Divider, Grid, Button } from "@mui/material";
import { useGetJob, useGetDocuments, useGetEmailHistory, useApproveDocument, useApproveEmail, useRegenerate, useRerunATS } from "@/hooks/queryHooks";
import KeywordGrid from "@/components/layout/KeywordGrid";
import GeneratePanel from "@/components/layout/GeneratePanel";
import DocumentViewer from "@/components/layout/DocumentViewer";
import EmailScoreCard from "@/components/layout/EmailScoreCard";
import ScoreRing from "@/components/layout/ScoreRing";
import DraftBadge from "@/components/layout/DraftBadge";
import { Building2, MapPin, Calendar, RefreshCcw } from "lucide-react";
import { useSnackbar } from "@/context/SnackbarContext";

interface JobDetailPageProps {
  params: { id: string };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const id = params.id;
  const { job, loading, refetch } = useGetJob(id);
  const { documents, refetch: refetchDocs } = useGetDocuments(id);
  const { emails, refetch: refetchEmails } = useGetEmailHistory(id);
  const { approve: approveDoc } = useApproveDocument();
  const { approve: approveEmail } = useApproveEmail();
  const { regenerate } = useRegenerate();
  const { rerun: rerunATS, busy: rerunning } = useRerunATS();
  const { showSnackbar } = useSnackbar();

  if (loading || !job) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  const handleApproveDoc = async (docId: string) => {
    try {
      await approveDoc(docId);
      showSnackbar("Document approved", "success");
      refetchDocs();
    } catch {
      showSnackbar("Failed to approve", "error");
    }
  };

  const handleApproveEmail = async (emailId: string) => {
    try {
      await approveEmail(emailId);
      showSnackbar("Email approved", "success");
      refetchEmails();
    } catch {
      showSnackbar("Failed to approve", "error");
    }
  };

  const handleRegen = async (type: "resume" | "cover-letter" | "email") => {
    try {
      await regenerate(job.id, type);
      showSnackbar(`${type} regenerated`, "success");
      refetchDocs();
      refetchEmails();
    } catch {
      showSnackbar("Failed to regenerate", "error");
    }
  };

  const handleRerunATS = async () => {
    try {
      await rerunATS(job.id);
      showSnackbar("ATS analysis re-calculated", "success");
      await refetch();
    } catch (e) {
      console.error(e);
      showSnackbar("Failed to re-run ATS analysis", "error");
    }
  };

  return (
    <Stack gap={4} maxWidth={1200} mx="auto">
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" bgcolor="background.paper" p={4} borderRadius={4} boxShadow="0 1px 3px rgba(0,0,0,0.1)">
        <Stack gap={1}>
          <Typography variant="h4" fontWeight={800}>
            {job.title}
          </Typography>
          <Stack direction="row" gap={3} mt={1}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Building2 size={16} color="#6b7280" />
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                {job.company}
              </Typography>
            </Stack>
            {job.location && (
              <Stack direction="row" alignItems="center" gap={0.5}>
                <MapPin size={16} color="#9ca3af" />
                <Typography variant="body1" color="text.secondary">
                  {job.location}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Calendar size={16} color="#9ca3af" />
              <Typography variant="body1" color="text.secondary">
                Added {new Date(job.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        {job.atsScore !== null && job.atsScore !== undefined && (
          <ScoreRing score={job.atsScore} size={90} label="ATS Score" />
        )}
      </Stack>

      <Grid container spacing={4}>
        {/* Left Column: Generator & ATS */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack gap={4}>
            <GeneratePanel jobId={job.id} onComplete={() => { refetchDocs(); refetchEmails(); void refetch(); }} />

            {job.atsBreakdown && (
              <Stack bgcolor="background.paper" p={3} borderRadius={4} gap={3} boxShadow="0 1px 3px rgba(0,0,0,0.1)">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>ATS Breakdown</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleRerunATS}
                    disabled={rerunning}
                    startIcon={rerunning ? <CircularProgress size={14} /> : <RefreshCcw size={14} />}
                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.75rem" }}
                  >
                    {rerunning ? "Calculating..." : "Re-run Review"}
                  </Button>
                </Stack>
                <KeywordGrid
                  matched={job.atsBreakdown.matchedKeywords || []}
                  missing={job.atsBreakdown.missingKeywords || []}
                  title=""
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center" }}>
                  Useful after updating your profile details.
                </Typography>
              </Stack>
            )}
          </Stack>
        </Grid>

        {/* Right Column: Documents & Emails */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack gap={4}>
            {/* Documents */}
            <Stack gap={2}>
              <Typography variant="h6" fontWeight={700}>Generated Documents</Typography>
              {documents.length === 0 ? (
                <Typography color="text.secondary">No documents generated yet. Use the panel on the left.</Typography>
              ) : (
                documents.map((doc) => (
                  <DocumentViewer
                    key={doc.id}
                    document={doc}
                    onApprove={handleApproveDoc}
                    onRegenerate={() => handleRegen(doc.type)}
                  />
                ))
              )}
            </Stack>

            <Divider />

            {/* Emails */}
            <Stack gap={2}>
              <Typography variant="h6" fontWeight={700}>Cold Emails</Typography>
              {emails.length === 0 ? (
                <Typography color="text.secondary">No emails generated yet.</Typography>
              ) : (
                emails.map((email) => (
                  <Stack key={email.id} gap={2} p={3} bgcolor="background.paper" borderRadius={4} border="1px solid" borderColor={email.status === 'draft' ? 'warning.main' : 'divider'}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" gap={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>To: {email.to || "Not specified"}</Typography>
                        <DraftBadge status={email.status} />
                      </Stack>
                      {email.status === "draft" && (
                        <Chip label="Approve & Send" color="success" onClick={() => handleApproveEmail(email.id)} sx={{ cursor: "pointer", fontWeight: 700 }} />
                      )}
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>Subject: {email.subject}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", bgcolor: "rgba(255,255,255,0.02)", p: 2, borderRadius: 2 }}>
                      {email.body}
                    </Typography>
                    <EmailScoreCard scores={email.scores} />
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
