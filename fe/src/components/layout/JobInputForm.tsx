"use client";

import React, { useState, useRef } from "react";
import { Stack, Box, Typography, TextField, Button, CircularProgress, Alert, Tabs, Tab, IconButton } from "@mui/material";
import { FileText, Sparkles, UploadCloud, X } from "lucide-react";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";

interface JobInputFormProps {
  onJobCreated?: (job: any) => void;
}

export default function JobInputForm({ onJobCreated }: JobInputFormProps) {
  const { showSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ title: "", company: "", location: "", type: "", rawDescription: "" });
  const [loading, setLoading] = useState(false);
  const [parsingImage, setParsingImage] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleParseImage = async () => {
    if (!selectedImage) return;
    setParsingImage(true);
    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await axiosInstance.post("/api/jobs/parse-image", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = res.data?.data;
      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          company: data.company || prev.company,
          location: data.location || prev.location,
          type: data.type || prev.type,
          rawDescription: data.rawDescription || prev.rawDescription,
        }));
        setCharCount((data.rawDescription || "").length);
        showSnackbar("Image parsed successfully! Please review the extracted data.", "success");
        setTab(0); // Switch back to text tab to review
      } else {
        showSnackbar("Failed to parse image data", "error");
      }
    } catch {
      showSnackbar("Failed to parse image — check console", "error");
    } finally {
      setParsingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.rawDescription.trim()) {
      showSnackbar("Job description is required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/jobs", form);
      if (res.data?.data) {
        showSnackbar(`Job created! ATS Score: ${res.data.data.atsScore ?? "N/A"}`, "success");
        onJobCreated?.(res.data.data);
        setForm({ title: "", company: "", location: "", type: "", rawDescription: "" });
        setCharCount(0);
        handleClearImage();
      } else {
        showSnackbar(res.data?.message || "Failed to create job", "error");
      }
    } catch {
      showSnackbar("Network error — is the server running?", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={3}>
      <Tabs value={tab} onChange={(_, nv) => setTab(nv)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Manual Entry" icon={<FileText size={16} />} iconPosition="start" />
        <Tab label="Screenshot Scan (AI)" icon={<Sparkles size={16} />} iconPosition="start" />
      </Tabs>

      {tab === 1 && (
        <Stack gap={2} p={3} bgcolor="action.hover" borderRadius={1} border="1px dashed" borderColor="divider" alignItems="center">
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageSelect} />
          
          {!selectedImage ? (
            <Stack alignItems="center" gap={1} onClick={() => fileInputRef.current?.click()} sx={{ cursor: 'pointer', py: 4 }}>
              <Box p={2} bgcolor="rgba(99, 102, 241, 0.1)" borderRadius="50%">
                <UploadCloud size={32} color="#6366f1" />
              </Box>
              <Typography variant="h6" fontWeight={700}>Click or Drag to upload screenshot</Typography>
              <Typography variant="body2" color="text.secondary">Supports PNG, JPG (Max 5MB)</Typography>
            </Stack>
          ) : (
            <Stack width="100%" gap={2}>
              <Box position="relative" borderRadius={1} overflow="hidden" border="1px solid" borderColor="divider">
                <img src={previewUrl!} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} />
                <IconButton onClick={handleClearImage} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)' }}>
                  <X size={16} color="#fff" />
                </IconButton>
              </Box>
              <Button 
                variant="contained" 
                color="secondary"
                fullWidth 
                onClick={handleParseImage}
                disabled={parsingImage}
                startIcon={parsingImage ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
              >
                {parsingImage ? "Scanning image..." : "Extract Job Details"}
              </Button>
            </Stack>
          )}
        </Stack>
      )}

      {tab === 0 && (
        <Stack gap={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              label="Job Title"
              size="small"
              fullWidth
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Senior Frontend Engineer"
            />
            <TextField
              label="Company"
              size="small"
              fullWidth
              value={form.company}
              onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              placeholder="e.g. Stripe"
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              label="Location"
              size="small"
              fullWidth
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Remote / San Francisco, CA"
            />
            <TextField
              label="Job Type"
              size="small"
              fullWidth
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              placeholder="e.g. Full-time, Contract"
            />
          </Stack>
          <Stack gap={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>
                Job Description <span style={{ color: "red" }}>*</span>
              </Typography>
              <Typography variant="caption" color={charCount > 500 ? "success.main" : "text.secondary"}>
                {charCount} chars {charCount < 200 && "— more detail = better ATS score"}
              </Typography>
            </Stack>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={form.rawDescription}
              onChange={(e) => { setForm((p) => ({ ...p, rawDescription: e.target.value })); setCharCount(e.target.value.length); }}
              placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications for the best ATS match..."
              inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem", backgroundColor: "var(--mui-palette-action-hover)" } }}
            />
            {charCount > 0 && charCount < 200 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Add more detail for accurate ATS scoring and better AI generation.
              </Alert>
            )}
          </Stack>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
            onClick={handleSubmit}
            disabled={loading || !form.rawDescription.trim()}
            sx={{ alignSelf: "flex-start", px: 4, fontWeight: 700 }}
          >
            {loading ? "Analyzing..." : "Parse & Create Job"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
