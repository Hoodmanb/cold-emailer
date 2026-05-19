"use client";

import React from "react";
import { Stack, Typography, CircularProgress, Box, Alert } from "@mui/material";
import JobInputForm from "@/components/layout/JobInputForm";
import JobCard from "@/components/layout/JobCard";
import { useGetJobs } from "@/hooks/queryHooks";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

export default function JobsPage() {
  const { jobs, loading, refetch, error } = useGetJobs();
  const { showSnackbar } = useSnackbar();

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/jobs/${id}`);
      showSnackbar("Job deleted successfully", "success");
      refetch();
    } catch {
      showSnackbar("Failed to delete job", "error");
    }
  };

  return (
    <Stack gap={4} maxWidth={1000} mx="auto">
      <Stack>
        <Typography variant="h4" fontWeight={800}>
          Jobs & ATS
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track jobs, check ATS match scores, and generate optimized applications.
        </Typography>
      </Stack>

      <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Add New Job
        </Typography>
        <JobInputForm onJobCreated={() => refetch()} />
      </Box>

      <Stack gap={2}>
        <Typography variant="h6" fontWeight={700}>
          Your Jobs ({jobs?.length || 0})
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : jobs?.length === 0 ? (
          <Stack alignItems="center" py={4} bgcolor="background.paper" borderRadius={4} border="1px dashed #e5e7eb">
            <Typography color="text.secondary">No jobs added yet.</Typography>
          </Stack>
        ) : (
          <Stack gap={2}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
