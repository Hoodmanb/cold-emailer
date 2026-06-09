"use client";

import React, { useState } from "react";
import { Box, Grid, Stack, Typography, Paper, Alert, Skeleton, Button } from "@mui/material";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DollarSign,
  Coins,
  TrendingUp,
  Users,
  Cpu,
  Activity,
  RefreshCw,
} from "lucide-react";

import StatCard from "@/components/admin/StatCard";
import AdminTransactionsPanel from "@/components/admin/AdminTransactionsPanel";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { adminApi, type AdminAnalytics } from "@/lib/adminApi";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

interface ConsistencyResult {
  checked: boolean;
  issueCount: number;
  issues: Array<unknown>;
}

export default function AdminOverviewPage() {
  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminApi.get<AdminAnalytics>("/api/admin/billing/analytics"),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users-count"],
    queryFn: () => adminApi.get<Array<{ id: string }>>("/api/admin/users"),
  });

  const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null);

  const consistencyMutation = useMutation<ConsistencyResult, Error, void, unknown>({
    mutationFn: () => adminApi.post<ConsistencyResult>("/api/admin/consistency-check"),
    onSuccess: (data) => {
      setConsistencyResult(data);
    },
  });

  const analytics = analyticsQuery.data;
  const activeUsers = usersQuery.data?.length ?? 0;
  const topModel = analytics?.mostUsedModels?.[0]?.model ?? "—";

  if (analyticsQuery.isError) {
    return (
      <Alert severity="error">Failed to load admin analytics. Please try again later.</Alert>
    );
  }

  return (
    <Box maxWidth={1200}>
      {consistencyResult && (
        <Alert severity={consistencyResult.issueCount === 0 ? "success" : "warning"} sx={{ mb: 2 }}>
          {consistencyResult.issueCount === 0
            ? "All data is consistent."
            : `Found ${consistencyResult.issueCount} issue(s). Check server logs for details.`}
        </Alert>
      )}

      <Button size="small" variant="contained" onClick={() => consistencyMutation.mutate()} disabled={consistencyMutation.isPending} startIcon={<RefreshCw size={14} />}>Run Data Consistency Check</Button>

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.aiCostToday"
            label="AI Cost (Today)"
            value={formatUsd(analytics?.today.providerCost ?? 0)}
            subValue={`Month: ${formatUsd(analytics?.thisMonth.providerCost ?? 0)}`}
            icon={DollarSign}
            loading={analyticsQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.creditsConsumed"
            label="Credits Consumed"
            value={String(analytics?.today.creditsConsumed ?? 0)}
            subValue={`Month: ${analytics?.thisMonth.creditsConsumed ?? 0}`}
            icon={Coins}
            loading={analyticsQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.revenue"
            label="Total Revenue (Lifetime)"
            value={formatUsd(analytics?.lifetime.revenueGenerated ?? 0)}
            icon={TrendingUp}
            color="success.main"
            loading={analyticsQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.profit"
            label="Estimated Profit (Lifetime)"
            value={formatUsd(analytics?.lifetime.estimatedProfit ?? 0)}
            subValue={`Provider cost: ${formatUsd(analytics?.lifetime.totalProviderCost ?? 0)}`}
            icon={Activity}
            loading={analyticsQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.activeUsers"
            label="Active Users"
            value={String(activeUsers)}
            icon={Users}
            loading={usersQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            helpId="stat.topModel"
            label="Most Used AI Model"
            value={topModel}
            subValue={`${analytics?.totalRequests ?? 0} total requests`}
            icon={Cpu}
            loading={analyticsQuery.isLoading}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" gap={0.5} mb={2}>
          <Typography variant="h6" fontWeight={800}>Top Models</Typography>
          <AdminHelpTip helpId="stat.topModelsList" />
        </Stack>
        {analyticsQuery.isLoading ? (
          <Stack gap={1}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={32} />)}
          </Stack>
        ) : (
          <Stack gap={1}>
            {(analytics?.mostUsedModels ?? []).map((item) => (
              <Stack key={item.model} direction="row" justifyContent="space-between">
                <Typography variant="body2">{item.model}</Typography>
                <Typography variant="body2" fontWeight={700}>{item.count} requests</Typography>
              </Stack>
            ))}
            {!analytics?.mostUsedModels?.length && (
              <Typography variant="body2" color="text.secondary">No usage data yet</Typography>
            )}
          </Stack>
        )}
      </Paper>

      <Box mt={3}>
        <AdminTransactionsPanel />
      </Box>
    </Box>
  );
}