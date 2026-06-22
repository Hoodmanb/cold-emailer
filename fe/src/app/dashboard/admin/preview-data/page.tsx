"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Save, RefreshCw } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useGetPreviewData, useUpdatePreviewData } from "@/hooks/queryHooks/documentTemplates";
import { useSnackbar } from "@/context/SnackbarContext";

export default function AdminPreviewDataPage() {
  const { showSnackbar } = useSnackbar();
  const { data: rawData, isLoading, isError, refetch } = useGetPreviewData();
  const updateMutation = useUpdatePreviewData();

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (rawData) {
      setJsonText(JSON.stringify(rawData, null, 2));
    }
  }, [rawData]);

  const handleTextChange = (value: string) => {
    setJsonText(value);
    try {
      if (value.trim() === "") {
        setJsonError("JSON cannot be empty");
        return;
      }
      JSON.parse(value);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleSave = async () => {
    try {
      if (jsonError) {
        showSnackbar("Please fix JSON errors before saving", "error");
        return;
      }
      const parsed = JSON.parse(jsonText);
      await updateMutation.mutateAsync(parsed);
      showSnackbar("Default preview profile updated successfully", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to update preview profile", "error");
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      showSnackbar("JSON Formatted", "info");
    } catch (err: any) {
      setJsonError(err.message);
      showSnackbar("Cannot format invalid JSON", "warning");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Failed to load template preview data. Ensure the server is running and database is reachable.
        </Alert>
        <Button startIcon={<RefreshCw size={16} />} onClick={() => void refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <>
      <AdminPageHeader
        helpId="admin.previewData"
        title="Template Preview Data"
        description="Manage the default resume/CV profile data used as the base for template previews."
      />

      <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Profile JSON Dataset</Typography>
            <Typography variant="caption" color="text.secondary">
              This data will be used to render previews when user profiles are incomplete.
            </Typography>
          </Box>
          <Stack direction="row" gap={1}>
            <Button variant="outlined" size="small" onClick={handleFormat}>
              Format JSON
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Save size={16} />}
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending || Boolean(jsonError)}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Stack>

        {jsonError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Invalid JSON: {jsonError}
          </Alert>
        )}

        <TextField
          multiline
          fullWidth
          minRows={20}
          maxRows={30}
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          sx={{
            fontFamily: "monospace",
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
              fontSize: "0.85rem",
            },
          }}
        />
      </Paper>
    </>
  );
}
