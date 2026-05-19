"use client";

import React from "react";
import { Stack, Typography, Grid, Card, Box, CircularProgress, Chip } from "@mui/material";
import { useGetDashboardStats } from "@/hooks/queryHooks";
import { Activity, Briefcase, FileText, Send, Sparkles, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { stats, loading } = useGetDashboardStats();

  if (loading || !stats) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  const { metrics, pipeline, recentActivity, aiUsage, suggestedActions } = stats;

  return (
    <Stack gap={4} maxWidth={1200} mx="auto">
      <Stack>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          Command Center
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Overview of your career automation pipeline.
        </Typography>
      </Stack>

      {metrics.totalJobs === 0 && (
        <Card sx={{ p: 4, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
          <Stack gap={1}>
            <Typography variant="h5" fontWeight={700}>Welcome to CareerBot!</Typography>
            <Typography variant="body1">You don't have any jobs yet. Head over to the Jobs tab to start tracking your first application.</Typography>
          </Stack>
        </Card>
      )}

      {/* Metrics Row */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Box p={1.5} bgcolor="rgba(99, 102, 241, 0.1)" borderRadius={2}>
              <Briefcase size={24} color="#6366f1" />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={800}>{metrics.totalJobs}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Jobs</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Box p={1.5} bgcolor="rgba(16, 185, 129, 0.1)" borderRadius={2}>
              <FileText size={24} color="#10b981" />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={800}>{metrics.documentsGenerated}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Docs Generated</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Box p={1.5} bgcolor="rgba(245, 158, 11, 0.1)" borderRadius={2}>
              <Send size={24} color="#f59e0b" />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={800}>{metrics.emailsSent}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Emails Sent</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Box p={1.5} bgcolor="rgba(236, 72, 153, 0.1)" borderRadius={2}>
              <TrendingUp size={24} color="#ec4899" />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={800}>{metrics.avgAtsScore}%</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Avg ATS Score</Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column: Pipeline & Activity */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack gap={4}>
            {/* Pipeline Overview */}
            <Card sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Application Pipeline</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, bgcolor: 'divider', zIndex: 0 }} />
                
                {[
                  { label: "Drafted", val: pipeline.drafted },
                  { label: "Ready", val: pipeline.readyToApply },
                  { label: "Applied", val: pipeline.applied },
                  { label: "Follow Up", val: pipeline.followUpSent },
                  { label: "Interviews", val: pipeline.interviewing }
                ].map((step, idx) => (
                  <Stack key={idx} alignItems="center" gap={1} sx={{ zIndex: 1, bgcolor: 'background.paper', px: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid', borderColor: step.val > 0 ? 'primary.main' : 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                      <Typography fontWeight={800} color={step.val > 0 ? 'primary.main' : 'text.secondary'}>{step.val}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{step.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>

            {/* Recent Activity */}
            <Card sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <Activity size={20} />
                <Typography variant="h6" fontWeight={700}>Recent Activity</Typography>
              </Stack>
              <Stack gap={3}>
                {recentActivity.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
                ) : (
                  recentActivity.map((log: any) => (
                    <Stack key={log.id} direction="row" gap={2} alignItems="flex-start">
                      <Box mt={0.5} width={8} height={8} borderRadius="50%" bgcolor="primary.main" />
                      <Stack>
                        <Typography variant="body1" fontWeight={600}>{log.details || log.action}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: AI Usage & Suggestions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack gap={4}>
            {/* Suggested Actions */}
            <Card sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <AlertCircle size={20} color="#f59e0b" />
                <Typography variant="h6" fontWeight={700}>Suggested Actions</Typography>
              </Stack>
              <Stack gap={2}>
                {suggestedActions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">You're all caught up!</Typography>
                ) : (
                  suggestedActions.map((action: any) => (
                    <Box key={action.id} p={2} bgcolor="rgba(255,255,255,0.03)" borderRadius={2} border="1px solid" borderColor="divider">
                      <Typography variant="body2" fontWeight={600} mb={1}>{action.text}</Typography>
                      <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', color: 'primary.main' }}>
                        <Typography variant="body2" fontWeight={700}>Take Action</Typography>
                        <ArrowRight size={14} />
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Card>

            {/* AI Usage */}
            <Card sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <Sparkles size={120} />
              </Box>
              <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <Sparkles size={20} color="#6366f1" />
                <Typography variant="h6" fontWeight={700}>AI Insights</Typography>
              </Stack>
              <Stack gap={3}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Current Model</Typography>
                  <Chip label={aiUsage.model} size="small" color="primary" variant="outlined" />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Generations (7d)</Typography>
                  <Typography variant="body1" fontWeight={700}>{aiUsage.weeklyGenerations}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Quality Score</Typography>
                  <Typography variant="body1" fontWeight={700}>{aiUsage.avgQualityScore} / 10</Typography>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
