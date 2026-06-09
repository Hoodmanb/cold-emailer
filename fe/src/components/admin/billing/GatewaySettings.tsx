"use client";

import React, { useEffect, useState } from "react";
import {
  Stack,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Skeleton,
  Alert,
  InputAdornment,
  Tooltip,
  Box,
} from "@mui/material";
import { HelpCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import { adminApi, type GatewayConfig } from "@/lib/adminApi";
import { formatMoney } from "@/hooks/queryHooks/billing";

export default function GatewaySettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ price: "", durationMonths: "12", active: "true" });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "gateway"],
    queryFn: () => adminApi.get<GatewayConfig>("/api/admin/gateway"),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      price: String(data.price ?? ""),
      durationMonths: String(data.durationMonths ?? 12),
      active: data.active ? "true" : "false",
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.put<GatewayConfig>("/api/admin/gateway", {
        price: Number(form.price || data?.price),
        durationMonths: Number(form.durationMonths || data?.durationMonths),
        active: form.active === "true",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gateway"] }),
  });

  if (isLoading) {
    return (
      <ConfigSectionCard
        helpId="billing.gateway"
        title="Gateway Configuration"
        description="Paystack gateway access pricing"
      >
        <Stack spacing={2}>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={36} width={160} />
        </Stack>
      </ConfigSectionCard>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
        Failed to load gateway configuration.
      </Alert>
    );
  }

  return (
    <ConfigSectionCard
      helpId="billing.gateway"
      title="Gateway Configuration"
      description="Paystack gateway access pricing and availability"
    >
      <Stack spacing={2} maxWidth={480}>
        <TextField
          label="Price (kobo)"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          size="small"
          type="number"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="The monetary cost in kobo (100 kobo = 1 Naira) for Paystack gateway access." arrow>
                  <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                    <HelpCircle size={16} />
                  </Box>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Duration (months)"
          value={form.durationMonths}
          onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
          size="small"
          type="number"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="The duration in months that gateway access remains valid after payment." arrow>
                  <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                    <HelpCircle size={16} />
                  </Box>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" alignItems="center" gap={1}>
          <FormControl size="small" fullWidth>
            <InputLabel>Active</InputLabel>
            <Select
              label="Active"
              value={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value }))}
            >
              <MenuItem value="true">Enabled</MenuItem>
              <MenuItem value="false">Disabled</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Enable or disable gateway payment access." arrow>
            <Box sx={{ color: "text.secondary", cursor: "help", flexShrink: 0 }}>
              <HelpCircle size={16} />
            </Box>
          </Tooltip>
        </Stack>
        <Button
          variant="contained"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          sx={{ alignSelf: "flex-start" }}
        >
          {saveMutation.isPending ? "Saving…" : "Save Gateway Settings"}
        </Button>
        {data && (
          <Typography variant="caption" color="text.secondary">
            Current: {formatMoney(data.price, data.currency)} / {data.durationMonths} months
          </Typography>
        )}
      </Stack>
    </ConfigSectionCard>
  );
}
