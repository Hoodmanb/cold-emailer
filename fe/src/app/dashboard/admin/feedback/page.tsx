"use client";

import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Filter, RefreshCw, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfigSectionCard from "@/components/admin/ConfigSectionCard";
import DataTable, { DataTableColumn } from "@/components/admin/DataTable";
import { adminApi } from "@/lib/adminApi";
import { showToast } from "@/context/SnackbarContext";

interface FeedbackItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;
  subject: string;
  category: string;
  message: string;
  pageUrl: string | null;
  browserInfo: string | null;
  status: "New" | "In Review" | "Resolved" | "Closed";
}

const CATEGORIES = ["Bug Report", "Feature Request", "General Feedback", "Account Issue", "Other"];
const STATUSES = ["New", "In Review", "Resolved", "Closed"];

export default function AdminFeedbackPage() {
  const qc = useQueryClient();

  // Filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal Detail state
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Fetch feedback submissions
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "feedback", search, category, status, userQuery, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (category) params.append("category", category);
      if (status) params.append("status", status);
      if (userQuery.trim()) params.append("user", userQuery.trim());
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      return adminApi.get<FeedbackItem[]>(`/api/admin/feedback?${params.toString()}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      adminApi.put(`/api/admin/feedback/${id}/status`, { status: nextStatus }),
    onSuccess: (updatedItem: any) => {
      qc.invalidateQueries({ queryKey: ["admin", "feedback"] });
      // Update selected item in modal if open
      if (selectedFeedback && selectedFeedback.id === updatedItem.id) {
        setSelectedFeedback(updatedItem);
      }
      showToast("Feedback status updated", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to update status", "error");
    },
  });

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setUserQuery("");
    setDateFrom("");
    setDateTo("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "error";
      case "In Review":
        return "warning";
      case "Resolved":
        return "success";
      case "Closed":
        return "default";
      default:
        return "default";
    }
  };

  const columns: DataTableColumn<FeedbackItem>[] = [
    {
      id: "user",
      label: "User",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.userName || "N/A"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.userEmail}
          </Typography>
        </Box>
      ),
    },
    {
      id: "category",
      label: "Category",
      render: (row) => (
        <Chip
          label={row.category}
          size="small"
          variant="outlined"
          color={row.category === "Bug Report" ? "error" : "primary"}
        />
      ),
    },
    {
      id: "subject",
      label: "Subject",
      render: (row) => (
        <Typography variant="body2" sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.subject}
        </Typography>
      ),
    },
    {
      id: "date",
      label: "Date Submitted",
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={getStatusColor(row.status)}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: (row) => (
        <IconButton size="small" onClick={() => setSelectedFeedback(row)} aria-label="View Details">
          <Eye size={16} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box maxWidth={1100}>
      <AdminPageHeader
        helpId="stat.transactions"
        title="Feedback & Support Cases"
        description="Monitor, search, and manage user feedback submissions."
      />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load feedback records.
        </Alert>
      )}

      {/* Filter Controls Panel */}
      <ConfigSectionCard title="Filter & Search" description="Refine and query submissions.">
        <Grid container spacing={2} mb={1}>
          {/* Search text */}
          <Grid container sx={{ xs: 12, sm: 4, md: 3 }} >
            <TextField
              size="small"
              fullWidth
              label="Search keyword"
              placeholder="Search subject or message"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          {/* User query */}
          <Grid container sx={{ xs: 12, sm: 4, md: 3 }} >
            <TextField
              size="small"
              fullWidth
              label="Filter by User"
              placeholder="Email, ID, or name"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
          </Grid>

          {/* Category Dropdown */}
          <Grid container sx={{ xs: 6, sm: 4, md: 2 }} >
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="">All Categories</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Dropdown */}
          <Grid container sx={{ xs: 6, sm: 4, md: 2 }} >
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map((stat) => (
                  <MenuItem key={stat} value={stat}>
                    {stat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Date from */}
          <Grid container sx={{ xs: 6, sm: 4, md: 2 }} >
            <TextField
              size="small"
              fullWidth
              type="date"
              label="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Date to */}
          <Grid container sx={{ xs: 6, sm: 4, md: 2 }} >
            <TextField
              size="small"
              fullWidth
              type="date"
              label="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid container sx={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<X size={14} />}
              sx={{ borderRadius: 2 }}
            >
              Clear Filters
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => refetch()}
              startIcon={<RefreshCw size={14} />}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </ConfigSectionCard>

      {/* Submissions List */}
      <Box mt={3}>
        <ConfigSectionCard title="Submissions" description={`${data.length} feedback cases match criteria`}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <DataTable
              columns={columns}
              rows={data}
              getRowKey={(row) => row.id}
              emptyMessage="No feedback submissions found matching your filters."
            />
          )}
        </ConfigSectionCard>
      </Box>

      {/* Feedback Detail Dialog */}
      <Dialog
        open={selectedFeedback !== null}
        onClose={() => setSelectedFeedback(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={800}>
            Feedback Details
          </Typography>
          <IconButton onClick={() => setSelectedFeedback(null)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>

        {selectedFeedback && (
          <>
            <DialogContent dividers sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                {/* Meta details */}
                <Grid container spacing={2}>
                  <Grid container sx={{ xs: 12, sm: 6, }} >
                    <Typography variant="caption" color="text.secondary" display="block">
                      SUBMITTED BY
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedFeedback.userName || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedFeedback.userEmail}
                    </Typography>
                  </Grid>
                  <Grid container sx={{ xs: 12, sm: 6, }} >
                    <Typography variant="caption" color="text.secondary" display="block">
                      USER ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {selectedFeedback.userId}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Grid container spacing={2}>
                  <Grid container sx={{ xs: 6 }} >
                    <Typography variant="caption" color="text.secondary" display="block">
                      CATEGORY
                    </Typography>
                    <Chip
                      label={selectedFeedback.category}
                      size="small"
                      variant="outlined"
                      color={selectedFeedback.category === "Bug Report" ? "error" : "primary"}
                    />
                  </Grid>
                  <Grid container sx={{ xs: 6 }} >
                    <Typography variant="caption" color="text.secondary" display="block">
                      STATUS
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 130, mt: 0.5 }}>
                      <Select
                        value={selectedFeedback.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: selectedFeedback.id,
                            nextStatus: e.target.value,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        sx={{ fontSize: "0.875rem", fontWeight: 700 }}
                      >
                        {STATUSES.map((stat) => (
                          <MenuItem key={stat} value={stat}>
                            {stat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    SUBJECT
                  </Typography>
                  <Typography variant="body1" fontWeight={800}>
                    {selectedFeedback.subject}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    MESSAGE BODY
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      whiteSpace: "pre-wrap",
                      fontSize: "0.9rem",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {selectedFeedback.message}
                  </Box>
                </Box>

                {selectedFeedback.pageUrl && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      PAGE SOURCE URL
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all", fontSize: "0.8rem" }}>
                      {selectedFeedback.pageUrl}
                    </Typography>
                  </Box>
                )}

                {selectedFeedback.browserInfo && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      BROWSER USER AGENT
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                      {selectedFeedback.browserInfo}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" onClick={() => setSelectedFeedback(null)} sx={{ borderRadius: 2 }}>
                Close Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
