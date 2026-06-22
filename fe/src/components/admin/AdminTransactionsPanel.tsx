"use client";

import React from "react";
import { Chip, Skeleton, Stack, Alert, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import { adminApi, type AdminTransaction } from "@/lib/adminApi";
import { formatMoney } from "@/hooks/queryHooks/billing";

type Props = {
  limit?: number;
};

export default function AdminTransactionsPanel({ limit = 20 }: Props) {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => adminApi.get<AdminTransaction[]>("/api/admin/transactions"),
  });

  // Defensive: adminApi may return axios response wrapper instead of array
  const transactions = Array.isArray(data)
    ? data
    : (data as any)?.data ?? [];
  const rows = transactions.slice(0, limit);

  const columns: DataTableColumn<AdminTransaction>[] = [
    { id: "type", label: "Type", render: (row) => row.type },
    {
      id: "amount",
      label: "Amount",
      render: (row) => formatMoney(row.amount, row.currency),
    },
    {
      id: "status",
      label: "Status",
      render: (row) => <Chip size="small" label={row.status} />,
    },
    {
      id: "user",
      label: "User",
      render: (row) => `${row.userId.slice(0, 8)}…`,
    },
    {
      id: "date",
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <ConfigSectionCard
      helpId="stat.transactions"
      title="Recent Transactions"
      description={`Last ${limit} payment events`}
    >
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load transactions.
        </Alert>
      )}
      {isLoading ? (
        <Stack gap={1}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={36} />)}</Stack>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No transactions yet"
        />
      )}
    </ConfigSectionCard>
  );
}