"use client";

import React from "react";
import { Box, Stack, Typography, Alert, Skeleton, Chip, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, type UsageLog } from "@/lib/adminApi";

export default function AdminUsagePage() {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "usage-logs"],
    queryFn: () => adminApi.get<UsageLog[]>("/api/admin/billing/usage-logs?limit=100"),
  });

  const columns: DataTableColumn<UsageLog>[] = [
    {
      id: "user",
      label: "User",
      render: (row) => `${row.user_id.slice(0, 8)}…`,
    },
    {
      id: "model",
      label: "Provider / Model",
      render: (row) => `${row.provider}/${row.model}`,
    },
    {
      id: "feature_cost",
      label: "Feature Cost",
      align: "right",
      render: (row) => row.metadata?.feature_cost ?? 0,
    },
    {
      id: "token_cost",
      label: "Token Cost",
      align: "right",
      render: (row) => row.metadata?.token_cost ?? row.charged_credits,
    },
    {
      id: "total_credits",
      label: "Total Credits",
      align: "right",
      render: (row) => row.metadata?.total_cost ?? row.charged_credits,
    },
    {
      id: "date",
      label: "Date",
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <Box maxWidth={1100}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <AdminPageHeader
          helpId="page.usage"
          title="Usage Logs"
          description="Recent AI usage and credit charges"
          mb={0}
        />
        <Chip label={`${data.length} records`} size="small" />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load usage logs.
        </Alert>
      )}

      <ConfigSectionCard
        helpId="usage.recentActivity"
        title="Recent Activity"
        description="Last 100 usage events"
      >
        {isLoading ? (
          <Stack gap={1}>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={36} />)}</Stack>
        ) : (
          <DataTable columns={columns} rows={data} getRowKey={(row) => row.id} emptyMessage="No usage logs yet" />
        )}
      </ConfigSectionCard>
    </Box>
  );
}
