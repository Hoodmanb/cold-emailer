"use client";

import React, { useEffect } from "react";
import { Box, Typography, Paper, Stack, Chip, CircularProgress, Grid, Divider, Button, Alert, Skeleton } from "@mui/material";
import { Key, Coins, Clock, Receipt, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useBillingStatus, useBillingTransactions, useVerifyPayment, formatMoney } from "@/hooks/queryHooks/billing";
import { useSearchParams } from "next/navigation";
import { useSnackbar } from "@/context/SnackbarContext";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ----- Section Components ----- //
function CurrentPlanSection({ billing, isLoading }: { billing?: any; isLoading: boolean }) {
  const isGateway = billing?.billingType === "gateway";

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton variant="rectangular" width="100%" height={80} />
        </Stack>
      </Paper>
    );
  }

  // Defensive fallbacks
  const gatewayAccess = billing?.gatewayAccess ?? { isActive: false, expiresAt: null, activatedAt: null, paid: false };
  const credits = billing?.credits ?? 0;

  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800}>Current Plan</Typography>
          <Chip label={isGateway ? "Gateway" : "Token / Credits"} color={isGateway ? "primary" : "secondary"} size="small" />
        </Stack>
        {isGateway ? (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Key size={16} />
              <Typography variant="body2">Status: {gatewayAccess.isActive ? "Active" : "Expired"}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">Expires: {formatDate(gatewayAccess.expiresAt)}
                {gatewayAccess.daysRemaining != null && (
                  <> ({gatewayAccess.daysRemaining} days left)</>
                )}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Configure your API keys in Settings → AI Workflows.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Coins size={16} />
              <Typography variant="h4" fontWeight={900}>{credits}</Typography>
              <Typography color="text.secondary">credits remaining</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Credits are deducted per AI operation. Purchased credits expire after 6 months.
            </Typography>
          </Stack>
        )}
        <Button component={Link} href="/pricing" variant="contained" endIcon={<ExternalLink size={14} />}>Upgrade / Buy Credits</Button>
      </Stack>
    </Paper>
  );
}

function CreditBucketsSection({ billing, isLoading }: { billing?: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Skeleton variant="text" width={150} height={30} />
        <Skeleton variant="rectangular" width="100%" height={100} />
      </Paper>
    );
  }

  const buckets = billing?.creditExpiryBuckets ?? [];

  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h6" fontWeight={800} mb={2}>Credit Buckets</Typography>
      {!buckets.length ? (
        <Typography variant="body2" color="text.secondary">No active credit buckets.</Typography>
      ) : (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {buckets.map((bucket: any) => (
            <Stack key={bucket.id} direction="row" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={700}>{bucket.remaining} / {bucket.amount} credits</Typography>
                <Typography variant="caption" color="text.secondary">Purchased {formatDate(bucket.purchasedAt)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Expires {formatDate(bucket.expiresAt)}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function PaymentHistorySection({ transactions, isLoading }: { transactions?: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Skeleton variant="text" width={150} height={30} />
        <Skeleton variant="rectangular" width="100%" height={150} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Receipt size={18} />
        <Typography variant="h6" fontWeight={800}>Payment History</Typography>
      </Stack>
      {!transactions?.length ? (
        <Typography variant="body2" color="text.secondary">No transactions yet.</Typography>
      ) : (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {transactions.map((tx) => (
            <Stack key={tx.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="body2" fontWeight={700}> {tx.type === "gateway" ? "Gateway Plan" : "Credit Pack"}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(tx.createdAt)}</Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2">{formatMoney(tx.amount, tx.currency)}</Typography>
                <Chip label={tx.status} size="small" color={tx.status === "completed" ? "success" : "default"} />
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function BillingDashboardPage() {
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const verifyPayment = useVerifyPayment();

  // Billing status
  const { data: billing, isLoading: billingLoading, error: billingError } = useBillingStatus();
  // Transactions
  const { data: transactions = [], isLoading: txLoading } = useBillingTransactions();

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference && !verifyPayment.isPending && !verifyPayment.isSuccess) {
      verifyPayment.mutate(reference, {
        onSuccess: () => showSnackbar("Payment verified successfully", "success"),
        onError: () => showSnackbar("Payment verification failed", "error"),
      });
    }
  }, [searchParams, verifyPayment, showSnackbar]);

  // Global error fallback – show non‑blocking alert
  const globalError = billingError ? (
    <Alert severity="error" sx={{ mb: 2 }}>Failed to load billing information. Showing defaults.</Alert>
  ) : null;

  return (
    <Box maxWidth={1000} mx="auto">
      {globalError}
      <Stack spacing={1} mb={4}>
        <Typography variant="h4" fontWeight={800}>Billing &amp; Usage</Typography>
        <Typography color="text.secondary">Manage your plan, credits, and payment history.</Typography>
      </Stack>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>{
          <CurrentPlanSection billing={billing} isLoading={billingLoading} />
        }</Grid>
        <Grid size={{ xs: 12, md: 6 }}>{
          <CreditBucketsSection billing={billing} isLoading={billingLoading} />
        }</Grid>
        <Grid size={{ xs: 12 }}>{
          <PaymentHistorySection transactions={transactions} isLoading={txLoading} />
        }</Grid>
      </Grid>
    </Box>
  );
}
