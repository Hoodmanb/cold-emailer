"use client";

import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Alert,
  Skeleton,
  TextField,
  Button,
  Chip,
  Snackbar,
  Autocomplete,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { HelpCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, type AdminUser } from "@/lib/adminApi";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.get<AdminUser[]>("/api/admin/users"),
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      adminApi.post(`/api/admin/users/${selectedUser!.id}/grant-credits`, {
        amount: Number(grantAmount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setGrantAmount("");
      setSelectedUser(null);
      setSnackbar({ open: true, message: "Credits granted successfully" });
    },
    onError: () => {
      setSnackbar({ open: true, message: "Failed to grant credits" });
    },
  });

  const columns: DataTableColumn<AdminUser>[] = [
    {
      id: "name",
      label: "User",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      ),
    },
    {
      id: "type",
      label: "Billing Type",
      render: (row) => row.billingType,
    },
    {
      id: "credits",
      label: "Credits",
      align: "right",
      render: (row) => row.credits,
    },
    {
      id: "role",
      label: "Role",
      render: (row) => (
        <Chip size="small" label={row.role} color={row.role === "admin" ? "primary" : "default"} />
      ),
    },
  ];

  return (
    <Box maxWidth={1100}>
      <AdminPageHeader
        helpId="page.users"
        title="Users"
        description="User directory and credit management — more admin tools coming soon"
      />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load users.
        </Alert>
      )}

      <ConfigSectionCard
        helpId="users.grantCredits"
        title="Grant Credits"
        description="Manually add credits to a user account"
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} alignItems={{ sm: "flex-start" }}>
          <Autocomplete
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 320 }, flex: 1 }}
            options={data}
            loading={isLoading}
            value={selectedUser}
            onChange={(_, user) => setSelectedUser(user)}
            getOptionLabel={(user) => user.email}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(options, { inputValue }) => {
              const query = inputValue.trim().toLowerCase();
              if (!query) return options;
              return options.filter(
                (user) =>
                  user.email.toLowerCase().includes(query) ||
                  user.name.toLowerCase().includes(query),
              );
            }}
            noOptionsText="No users match your search"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search user by email or name"
                placeholder="e.g. jane@example.com"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <InputAdornment position="end">
                        <Tooltip title="Select the user who will receive the granted credits." arrow>
                          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help", mr: 1 }}>
                            <HelpCircle size={16} />
                          </Box>
                        </Tooltip>
                      </InputAdornment>
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, user) => {
              const { key, ...optionProps } = props;
              return (
                <Box component="li" key={key} {...optionProps} sx={{ py: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
              );
            }}
          />
          <TextField
            size="small"
            label="Credits to grant"
            type="number"
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ minWidth: { xs: "100%", sm: 160 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The number of credits to add to the selected user's balance." arrow>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                      <HelpCircle size={16} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            disabled={!selectedUser || !grantAmount || grantMutation.isPending}
            onClick={() => grantMutation.mutate()}
            sx={{ minHeight: 40 }}
          >
            Grant
          </Button>
        </Stack>
      </ConfigSectionCard>

      <ConfigSectionCard
        helpId="users.directory"
        title="All Users"
        description={`${data.length} registered users`}
      >
        {isLoading ? (
          <Stack gap={1}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={40} />)}</Stack>
        ) : (
          <DataTable
            columns={columns}
            rows={data}
            getRowKey={(row) => row.id}
            emptyMessage="No users found"
          />
        )}
      </ConfigSectionCard>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
