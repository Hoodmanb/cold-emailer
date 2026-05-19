"use client";

import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, TextField, Button, Typography, CircularProgress, Stack } from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

interface GeneralSettingsProps {
  onDirtyChange: (isDirty: boolean) => void;
  // Allows parent to supply latest drafts so state is preserved on tab switch
  initialDraft: any;
  onUpdateDraft: (draft: any) => void;
}

export default function GeneralSettings({
  onDirtyChange,
  initialDraft,
  onUpdateDraft,
}: GeneralSettingsProps) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(!initialDraft);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  
  // Set up local form fields state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    phoneNumber: "", // WhatsApp
    location: "",
    summary: "",
    githubUrl: "",
    linkedinUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/api/profile");
        if (res.data?.success && res.data?.data) {
          const profile = res.data.data;
          const cleanForm = {
            name: String(profile.name || "").trim(),
            email: String(profile.email || "").trim(),
            phone: String(profile.phone || "").trim(),
            phoneNumber: String(profile.phoneNumber || "").trim(),
            location: String(profile.location || "").trim(),
            summary: String(profile.summary || "").trim(),
            githubUrl: String(profile.githubUrl || profile.links?.github || "").trim(),
            linkedinUrl: String(profile.linkedinUrl || profile.links?.linkedin || "").trim(),
          };
          setOriginalData(cleanForm);
          if (!initialDraft) {
            setForm(cleanForm);
            onUpdateDraft(cleanForm);
          }
        } else {
          showSnackbar(res.data?.message || "Failed to load profile details", "error");
        }
      } catch (err) {
        console.error(err);
        showSnackbar("Failed to load profile details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (initialDraft) {
      setForm(initialDraft);
      // We still want to fetch profile in background to establish original comparison baseline
      void fetchProfile();
    } else {
      void fetchProfile();
    }
  }, []);

  // Compute dirty state
  const isDirty = originalData ? JSON.stringify(form) !== JSON.stringify(originalData) : false;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleFieldChange = (field: string, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    onUpdateDraft(nextForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return showSnackbar("Name is required", "error");
    }

    setSaving(true);
    try {
      // Sync links subobject for backward compatibility
      const payload = {
        ...form,
        links: {
          github: form.githubUrl,
          linkedin: form.linkedinUrl,
          portfolio: "",
        }
      };

      const res = await axiosInstance.put("/api/profile", payload);
      if (res.data?.success) {
        showSnackbar("Profile updated successfully", "success");
        setOriginalData(form);
        onDirtyChange(false);
      } else {
        showSnackbar(res.data?.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 4, py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={36} />
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, overflow: "visible" }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            General Profile Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your personal profile details. These details are used to populate resumes, cover letters, and other job generation pipelines automatically.
          </Typography>
        </Box>

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g. John Doe"
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="e.g. johndoe@example.com"
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                placeholder="e.g. +1 555-0199"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="WhatsApp Number"
                value={form.phoneNumber}
                onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                placeholder="e.g. +1 555-0199"
                helperText="For receiving automation status reports"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Location / Timezone"
                value={form.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="e.g. New York, USA (EST)"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Professional Summary"
                value={form.summary}
                onChange={(e) => handleFieldChange("summary", e.target.value)}
                placeholder="Brief summary of your core skills, professional experience, and target roles..."
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="GitHub URL"
                value={form.githubUrl}
                onChange={(e) => handleFieldChange("githubUrl", e.target.value)}
                placeholder="e.g. https://github.com/username"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="LinkedIn Profile URL"
                value={form.linkedinUrl}
                onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
                placeholder="e.g. https://linkedin.com/in/username"
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4, borderTop: 1, borderColor: "divider", pt: 3 }}>
            {isDirty && (
              <Typography variant="body2" color="warning.main" alignSelf="center" sx={{ fontWeight: 600 }}>
                Unsaved modifications
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || saving}
              sx={{ minWidth: 120, height: 40 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
