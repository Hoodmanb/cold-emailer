"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Award, Pencil, Plus, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import type { Certificate } from "@/types";
import { v4 as uuidv4 } from "uuid";

type CertificatesSectionProps = {
  certificates: Certificate[];
  onChange: (certificates: Certificate[]) => void;
};

export interface CertificatesSectionHandle {
  openNew: () => void;
}

export const CertificatesSection = forwardRef<CertificatesSectionHandle, CertificatesSectionProps>(
  ({ certificates, onChange }, ref) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Certificate>>({
      title: "",
      link: "",
      awarder: "",
      description: "",
    });

    useImperativeHandle(ref, () => ({
      openNew,
    }));

    const openNew = () => {
      setForm({ title: "", link: "", awarder: "", description: "" });
      setEditingId(null);
      setDialogOpen(true);
    };

    const openEdit = (cert: Certificate) => {
      setForm(cert);
      setEditingId(cert.id);
      setDialogOpen(true);
    };

    const handleSave = () => {
      if (!form.title || !form.link || !form.awarder) return;

      if (editingId) {
        onChange(
          certificates.map((cert) =>
            cert.id === editingId ? ({ ...cert, ...form } as Certificate) : cert
          )
        );
      } else {
        onChange([...certificates, { ...form, id: uuidv4() } as Certificate]);
      }
      setDialogOpen(false);
    };

    const handleDelete = (id: string) => {
      if (confirm("Delete this certificate?")) {
        onChange(certificates.filter((cert) => cert.id !== id));
      }
    };

    return (
      <Stack gap={2}>
        {certificates.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              borderRadius: 4,
              border: "2px dashed",
              borderColor: "divider",
              textAlign: "center",
              bgcolor: "action.hover",
            }}
          >
            <ShieldCheck size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              No certificates added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: "auto" }}>
              Showcase your credentials and professional certifications.
            </Typography>
          </Box>
        ) : (
          <Stack gap={2}>
            {certificates.map((cert) => (
              <Card
                key={cert.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Stack direction="row" gap={2} sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2.5,
                        bgcolor: "secondary.lighter",
                        color: "secondary.main",
                        height: "fit-content",
                      }}
                    >
                      <Award size={24} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        component="a"
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.75,
                          color: "text.primary",
                          textDecoration: "none",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        {cert.title || cert.awarder} <ExternalLink size={14} />
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block" }}>
                        {cert.awarder}
                      </Typography>
                      {cert.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, lineHeight: 1.5 }}
                        >
                          {cert.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          size="small"
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<ExternalLink size={14} />}
                          sx={{ 
                            fontWeight: 700, 
                            borderRadius: 1.5, 
                            textTransform: "none",
                            fontSize: "0.75rem"
                          }}
                        >
                          View Certificate
                        </Button>
                      </Box>
                    </Box>
                  </Stack>
                  <Stack direction="row" gap={0.5}>
                    <IconButton size="small" onClick={() => openEdit(cert)} sx={{ borderRadius: 2 }}>
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(cert.id)}
                      sx={{ borderRadius: 2 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 5 } }}
        >
          <DialogTitle fontWeight={900}>
            {editingId ? "Edit Certificate" : "Add Certificate"}
          </DialogTitle>
          <DialogContent>
            <Stack gap={2.5} sx={{ mt: 1.5 }}>
              <TextField
                label="Certificate Title"
                fullWidth
                required
                size="small"
                placeholder="e.g. Full Stack Web Development"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <TextField
                label="Link / URL"
                fullWidth
                required
                size="small"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <TextField
                label="Awarder / Company"
                fullWidth
                required
                size="small"
                placeholder="e.g. Google, Coursera"
                value={form.awarder}
                onChange={(e) => setForm({ ...form, awarder: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <TextField
                label="Short Description"
                fullWidth
                multiline
                rows={3}
                placeholder="Briefly describe what you achieved..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!form.title || !form.link || !form.awarder}
              sx={{ borderRadius: 2.5, fontWeight: 700, px: 3 }}
            >
              Save Certificate
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }
);

CertificatesSection.displayName = "CertificatesSection";
