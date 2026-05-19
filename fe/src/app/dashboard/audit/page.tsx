"use client";

import React, { useState } from "react";
import { Stack, Typography, CircularProgress, Box, TextField, InputAdornment } from "@mui/material";
import { Search } from "lucide-react";
import { useGetAuditLog } from "@/hooks/queryHooks";
import AuditLogViewer from "@/components/layout/AuditLogViewer";

export default function AuditPage() {
  const [filter, setFilter] = useState("");
  const { logs, loading } = useGetAuditLog(500);

  const filteredLogs = logs?.filter(log =>
    (log.action?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (log.details?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (log.module?.toLowerCase() || "").includes(filter.toLowerCase())
  ) || [];

  return (
    <Stack gap={4} maxWidth={1000} mx="auto">
      <Stack>
        <Typography variant="h4" fontWeight={800}>Audit Log</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track all system actions, AI generations, and manual edits to maintain full observability.
        </Typography>
      </Stack>

      <Box p={3} bgcolor="background.paper" borderRadius={3} border="1px solid" borderColor="divider" boxShadow="0 1px 3px rgba(0,0,0,0.05)">
        <Stack gap={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Filter logs by action, details, or module..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>
            }}
          />

          {loading ? (
            <Stack alignItems="center" py={4}><CircularProgress /></Stack>
          ) : (
            <Box maxHeight={600} overflow="auto" pr={1}>
              <AuditLogViewer logs={filteredLogs} />
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
