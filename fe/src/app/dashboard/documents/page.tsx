"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Eye,
  Download,
  Edit2,
  Trash2,
  FileText,
  Search,
  Plus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { downloadAuthenticatedFile } from "@/utils/downloadUtils";
import DocumentPreviewModal from "@/components/documents/DocumentPreviewModal";
import DocumentEditModal from "@/components/documents/DocumentEditModal";
import { format } from "date-fns";

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [editDoc, setEditDoc] = useState<any>(null);

  // Fetch Documents
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/documents");
      return res.data.data;
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar("Document deleted successfully", "success");
    },
    onError: () => {
      showSnackbar("Failed to delete document", "error");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await axiosInstance.put(`/api/documents/${id}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showSnackbar("Document updated successfully", "success");
    },
    onError: () => {
      showSnackbar("Failed to update document", "error");
    },
  });

  const handleDownload = async (doc: any) => {
    try {
      const docFormat = doc.format || "markdown";
      const filename = `${doc.type}_${doc.id}.${docFormat}`;
      await downloadAuthenticatedFile(
        `/api/documents/${doc.id}/download`,
        filename,
        docFormat
      );
      showSnackbar("Download started", "success");
    } catch (err) {
      showSnackbar("Download failed", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "draft": return "warning";
      case "archived": return "default";
      default: return "primary";
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Failed to load documents. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {documents?.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 10, display: "flex", borderRadius: 4, borderStyle: "dashed", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <FileText size={64} style={{ marginBottom: 16, opacity: 0.2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No documents found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Use the floating productivity widget to generate your first document.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell><Typography fontWeight={700}>Title / Type</Typography></TableCell>
                <TableCell><Typography fontWeight={700}>Date Created</Typography></TableCell>
                <TableCell><Typography fontWeight={700}>Status</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight={700}>Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc: any) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main" }}>
                        <FileText size={20} />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={700}>{doc.type.toUpperCase().replace("-", " ")}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {doc.id.substring(0, 8)}...</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{format(new Date(doc.createdAt), "MMM dd, yyyy HH:mm")}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(doc.status) as any}
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: "10px" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => setPreviewDoc(doc)} color="primary">
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(doc)} color="success">
                          <Download size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditDoc(doc)} color="warning">
                          <Edit2 size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this document?")) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modals */}
      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDownload={() => handleDownload(previewDoc)}
      />

      <DocumentEditModal
        open={!!editDoc}
        onClose={() => setEditDoc(null)}
        document={editDoc}
        onSave={async (id, updates) => {
          await updateMutation.mutateAsync({ id, updates });
        }}
      />

    </Box>
  );
};

export default DocumentsPage;
