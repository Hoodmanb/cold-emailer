"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
  IconButton
} from "@mui/material";
import { X, Send, CheckCircle2 } from "lucide-react";
import axiosInstance from "@/hooks/axios";

interface FeedbackFormModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "General Feedback",
  "Account Issue",
  "Other"
];

export default function FeedbackFormModal({ open, onClose }: FeedbackFormModalProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (open) {
      setSubject("");
      setCategory("");
      setMessage("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !category || !message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      const browserInfo = typeof navigator !== "undefined" ? navigator.userAgent : "";

      await axiosInstance.post("/api/feedback", {
        subject: subject.trim(),
        category,
        message: message.trim(),
        pageUrl,
        browserInfo
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={800}>
          Share Your Feedback
        </Typography>
        <IconButton onClick={onClose} disabled={isLoading} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {success ? (
          <Stack alignItems="center" spacing={2} py={4} textAlign="center">
            <Box sx={{ color: "success.main" }}>
              <CheckCircle2 size={64} />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              Thank You!
            </Typography>
            <Typography color="text.secondary" maxWidth={360}>
              Your feedback has been submitted successfully and our team has been notified.
            </Typography>
            <Button variant="contained" onClick={onClose} sx={{ mt: 2, px: 4, borderRadius: 2 }}>
              Close
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <FormControl fullWidth required size="small">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isLoading}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                required
                fullWidth
                size="small"
                label="Subject"
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 100))}
                disabled={isLoading}
                slotProps={{
                  htmlInput: { maxLength: 100 }
                }}
                helperText={`${subject.length}/100 characters`}
              />

              <TextField
                required
                fullWidth
                multiline
                rows={5}
                label="Message"
                placeholder="Please describe your bug report, feature request, or feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                disabled={isLoading}
                slotProps={{
                  htmlInput: { maxLength: 1000 }
                }}
                helperText={`${message.length}/1000 characters`}
              />
            </Stack>
          </Box>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
