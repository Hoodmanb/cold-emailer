"use client";

import React, { useState } from "react";
import {
  Box, Typography, Paper, Stack, Grid, TextField, Button, CircularProgress,
  Alert, Table, TableHead, TableRow, TableCell, TableBody, Chip, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/hooks/queryHooks/billing";
import useAuthStore from "@/store/useAuthStore";


async function adminGet<T>(path: string) {
  const { data } = await axiosInstance.get(path, { headers: { "X-Bypass-Global-Toast": "true" } });
  return data.data as T;
}

async function adminPut<T>(path: string, body: unknown) {
  const { data } = await axiosInstance.put(path, body);
  return data.data as T;
}

async function adminPost<T>(path: string, body?: unknown) {
  const { data } = await axiosInstance.post(path, body);
  return data.data as T;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [gatewayForm, setGatewayForm] = useState({ price: "", durationMonths: "12", active: "true" });
  const [packForm, setPackForm] = useState({ name: "", amount: "", price: "" });
  const [grantAmount, setGrantAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // State
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [editPackForm, setEditPackForm] = useState({ name: "", amount: "", price: "" });

  // Mutations
  const updatePack = useMutation({
    mutationFn: ({ id, name, amount, price }: { id: string; name: string; amount: string; price: string }) =>
      adminPut(`/api/admin/credit-packs/${id}`, {
        name,
        amount: Number(amount),
        price: Number(price),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "packs"] });
      setEditingPackId(null);
    },
  });

  const togglePack = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminPut(`/api/admin/credit-packs/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packs"] }),
  });

  if (user && user.role !== "admin") {
    return (
      <Alert severity="warning">
        Admin access required. Set ADMIN_EMAIL in server env to promote your account.
      </Alert>
    );
  }

  const { data: gateway, isLoading } = useQuery({
    queryKey: ["admin", "gateway"],
    queryFn: () => adminGet<{ price: number; currency: string; durationMonths: number; active: boolean }>("/api/admin/gateway"),
    enabled: user?.role === "admin",
  });

  const { data: packs = [] } = useQuery({
    queryKey: ["admin", "packs"],
    queryFn: () => adminGet<Array<{ id: string; name: string; amount: number; price: number; currency: string; active: boolean }>>("/api/admin/credit-packs"),
    enabled: user?.role === "admin",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminGet<Array<{ id: string; name: string; email: string; billingType: string; credits: number; role: string }>>("/api/admin/users"),
    enabled: user?.role === "admin",
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => adminGet<Array<{ id: string; type: string; amount: number; currency: string; status: string; userId: string; createdAt: string }>>("/api/admin/transactions"),
    enabled: user?.role === "admin",
  });

  const updateGateway = useMutation({
    mutationFn: () => adminPut("/api/admin/gateway", {
      price: Number(gatewayForm.price || gateway?.price),
      durationMonths: Number(gatewayForm.durationMonths || gateway?.durationMonths),
      active: gatewayForm.active === "true",
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gateway"] }),
  });

  const createPack = useMutation({
    mutationFn: () => adminPost("/api/admin/credit-packs", {
      name: packForm.name,
      amount: Number(packForm.amount),
      price: Number(packForm.price),
      currency: "NGN",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "packs"] });
      setPackForm({ name: "", amount: "", price: "" });
    },
  });

  const grantCredits = useMutation({
    mutationFn: () => adminPost(`/api/admin/users/${selectedUserId}/grant-credits`, { amount: Number(grantAmount) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  return (
    <Box maxWidth={1100} mx="auto">
      <Stack spacing={1} mb={4}>
        <Typography variant="h4" fontWeight={800}>Admin Control Panel</Typography>
        <Typography color="text.secondary">Manage gateway pricing, credit packs, users, and transactions.</Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={800} mb={2}>Gateway Configuration</Typography>
            <Stack spacing={2}>
              <TextField
                label="Price (kobo)"
                value={gatewayForm.price || String(gateway?.price || "")}
                onChange={(e) => setGatewayForm((f) => ({ ...f, price: e.target.value }))}
                size="small"
              />
              <TextField
                label="Duration (months)"
                value={gatewayForm.durationMonths || String(gateway?.durationMonths || 12)}
                onChange={(e) => setGatewayForm((f) => ({ ...f, durationMonths: e.target.value }))}
                size="small"
              />
              <FormControl size="small">
                <InputLabel>Active</InputLabel>
                <Select
                  label="Active"
                  value={gatewayForm.active}
                  onChange={(e) => setGatewayForm((f) => ({ ...f, active: e.target.value }))}
                >
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => updateGateway.mutate()} disabled={updateGateway.isPending}>
                Save Gateway Settings
              </Button>
              {gateway && (
                <Typography variant="caption" color="text.secondary">
                  Current: {formatMoney(gateway.price, gateway.currency)} / {gateway.durationMonths} months
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>


        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={800} mb={2}>Credit Packs</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Price (kobo)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* ── Create row ── */}
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>
                    <TextField
                      placeholder="Name"
                      value={packForm.name}
                      onChange={(e) => setPackForm((f) => ({ ...f, name: e.target.value }))}
                      size="small"
                      variant="standard"
                      inputProps={{ style: { fontSize: 13 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="Credits"
                      value={packForm.amount}
                      onChange={(e) => setPackForm((f) => ({ ...f, amount: e.target.value }))}
                      size="small"
                      variant="standard"
                      inputProps={{ style: { fontSize: 13 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="Price"
                      value={packForm.price}
                      onChange={(e) => setPackForm((f) => ({ ...f, price: e.target.value }))}
                      size="small"
                      variant="standard"
                      inputProps={{ style: { fontSize: 13 } }}
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!packForm.name || !packForm.amount || !packForm.price || createPack.isPending}
                      onClick={() => createPack.mutate()}
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>

                {/* ── Existing rows ── */}
                {packs.map((pack) =>
                  editingPackId === pack.id ? (
                    <TableRow key={pack.id}>
                      <TableCell>
                        <TextField
                          value={editPackForm.name}
                          onChange={(e) => setEditPackForm((f) => ({ ...f, name: e.target.value }))}
                          size="small"
                          variant="standard"
                          inputProps={{ style: { fontSize: 13 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editPackForm.amount}
                          onChange={(e) => setEditPackForm((f) => ({ ...f, amount: e.target.value }))}
                          size="small"
                          variant="standard"
                          inputProps={{ style: { fontSize: 13 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editPackForm.price}
                          onChange={(e) => setEditPackForm((f) => ({ ...f, price: e.target.value }))}
                          size="small"
                          variant="standard"
                          inputProps={{ style: { fontSize: 13 } }}
                        />
                      </TableCell>
                      <TableCell />
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            disabled={updatePack.isPending}
                            onClick={() => updatePack.mutate({ id: pack.id, ...editPackForm })}
                          >
                            Save
                          </Button>
                          <Button size="small" onClick={() => setEditingPackId(null)}>Cancel</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={pack.id} hover>
                      <TableCell>{pack.name}</TableCell>
                      <TableCell>{pack.amount}</TableCell>
                      <TableCell>{formatMoney(pack.price, pack.currency)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={pack.active ? "Active" : "Inactive"}
                          color={pack.active ? "success" : "default"}
                          onClick={() => togglePack.mutate({ id: pack.id, active: !pack.active })}
                          sx={{ cursor: "pointer" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingPackId(pack.id);
                            setEditPackForm({
                              name: pack.name,
                              amount: String(pack.amount),
                              price: String(pack.price),
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={800} mb={2}>User Management</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>User</InputLabel>
                <Select label="User" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Credits to grant" size="small" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} />
              <Button variant="outlined" disabled={!selectedUserId || !grantAmount} onClick={() => grantCredits.mutate()}>Grant Credits</Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover sx={{ cursor: "pointer" }} onClick={() => setSelectedUserId(u.id)}>
                    <TableCell>{u.name}<br /><Typography variant="caption">{u.email}</Typography></TableCell>
                    <TableCell>{u.billingType}</TableCell>
                    <TableCell>{u.credits}</TableCell>
                    <TableCell>{u.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={800} mb={2}>Transactions</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.slice(0, 20).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{formatMoney(tx.amount, tx.currency)}</TableCell>
                    <TableCell><Chip size="small" label={tx.status} /></TableCell>
                    <TableCell>{tx.userId.slice(0, 8)}…</TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
