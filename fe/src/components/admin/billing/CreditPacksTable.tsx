"use client";

import React, { useState } from "react";
import {
  Button,
  Chip,
  Stack,
  TextField,
  Skeleton,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  Tooltip,
  Box,
} from "@mui/material";
import { HelpCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import { adminApi, type CreditPack } from "@/lib/adminApi";
import { formatMoney } from "@/hooks/queryHooks/billing";

export default function CreditPacksTable() {
  const qc = useQueryClient();
  const [packForm, setPackForm] = useState({ name: "", amount: "", price: "" });
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [editPackForm, setEditPackForm] = useState({ name: "", amount: "", price: "" });

  const { data: packs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "packs"],
    queryFn: () => adminApi.get<CreditPack[]>("/api/admin/credit-packs"),
  });

  const createPack = useMutation({
    mutationFn: () =>
      adminApi.post<CreditPack>("/api/admin/credit-packs", {
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

  const updatePack = useMutation({
    mutationFn: ({ id, name, amount, price }: { id: string; name: string; amount: string; price: string }) =>
      adminApi.put<CreditPack>(`/api/admin/credit-packs/${id}`, {
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
      adminApi.put<CreditPack>(`/api/admin/credit-packs/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packs"] }),
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
        Failed to load credit packs.
      </Alert>
    );
  }

  return (
    <ConfigSectionCard helpId="billing.creditPacks" title="Credit Packs" description="Manage purchasable credit bundles">
      {isLoading ? (
        <Stack gap={1}>{[1, 2, 3].map((i) => <Skeleton key={i} height={36} />)}</Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell>
                <TextField
                  placeholder="Name"
                  value={packForm.name}
                  onChange={(e) => setPackForm((f) => ({ ...f, name: e.target.value }))}
                  size="small"
                  variant="standard"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="A descriptive name for the credit package (e.g. Starter Pack, Pro Tier)." arrow>
                          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                            <HelpCircle size={14} />
                          </Box>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Credits"
                  value={packForm.amount}
                  onChange={(e) => setPackForm((f) => ({ ...f, amount: e.target.value }))}
                  size="small"
                  variant="standard"
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="The number of credits users receive upon purchasing this package." arrow>
                          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                            <HelpCircle size={14} />
                          </Box>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Price (kobo)"
                  value={packForm.price}
                  onChange={(e) => setPackForm((f) => ({ ...f, price: e.target.value }))}
                  size="small"
                  variant="standard"
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="The price of the package in kobo (100 kobo = 1 Naira). E.g. 500000 kobo = 5000 NGN." arrow>
                          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                            <HelpCircle size={14} />
                          </Box>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
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

            {packs.map((pack) =>
              editingPackId === pack.id ? (
                <TableRow key={pack.id}>
                  <TableCell>
                    <TextField
                      value={editPackForm.name}
                      onChange={(e) => setEditPackForm((f) => ({ ...f, name: e.target.value }))}
                      size="small"
                      variant="standard"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="A descriptive name for the credit package (e.g. Starter Pack, Pro Tier)." arrow>
                              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                                <HelpCircle size={14} />
                              </Box>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={editPackForm.amount}
                      onChange={(e) => setEditPackForm((f) => ({ ...f, amount: e.target.value }))}
                      size="small"
                      variant="standard"
                      type="number"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="The number of credits users receive upon purchasing this package." arrow>
                              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                                <HelpCircle size={14} />
                              </Box>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={editPackForm.price}
                      onChange={(e) => setEditPackForm((f) => ({ ...f, price: e.target.value }))}
                      size="small"
                      variant="standard"
                      type="number"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="The price of the package in kobo (100 kobo = 1 Naira). E.g. 500000 kobo = 5000 NGN." arrow>
                              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", cursor: "help" }}>
                                <HelpCircle size={14} />
                              </Box>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
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
              ),
            )}
          </TableBody>
        </Table>
      )}
    </ConfigSectionCard>
  );
}
