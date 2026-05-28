"use client";

import React from "react";
import { Chip, Tooltip } from "@mui/material";
import { Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBillingStatus } from "@/hooks/queryHooks/billing";
import useAuthStore from "@/store/useAuthStore";

function formatDays(ms: number | null | undefined): number {
  if (!ms || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function BillingStatusChip() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: billing } = useBillingStatus();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const credits = billing?.credits ?? user.credits ?? 0;

  const gateway = billing?.gatewayAccess || user.gatewayAccess;
  const isGatewayActive = gateway?.isActive ?? false;

  const expiresAt = gateway?.expiresAt
    ? new Date(gateway.expiresAt).getTime()
    : null;

  const daysRemaining =
    isGatewayActive && expiresAt
      ? formatDays(expiresAt - Date.now())
      : 0;

  const hasCredits = credits > 0;

  let label = "";
  let color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" = "default";

  let icon = <Coins size={14} />;

  if (isAdmin) {
    label = "∞ Unlimited Access";
    color = "success";
  } else if (isGatewayActive) {
    label = `Gateway · ${daysRemaining}d left`;
    color = daysRemaining <= 5 ? "warning" : "success";
  } else if (gateway && !isGatewayActive) {
    label = "Gateway expired";
    color = "error";
  } else if (hasCredits) {
    label = `${credits} credits`;
    color = credits < 10 ? "warning" : "default";
  } else {
    label = "No subscription";
    color = "error";
  }

  return (
    <Tooltip title="View billing details">
      <Chip
        icon={icon}
        label={label}
        size="small"
        color={color}
        variant="outlined"
        onClick={() => router.push("/dashboard/billing")}
        sx={{ cursor: "pointer", fontWeight: 600 }}
      />
    </Tooltip>
  );
}