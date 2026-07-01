// fe/src/components/template/MyTemplatesSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Button,
    Paper,
    Skeleton,
    IconButton,
} from "@mui/material";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { DocumentTemplate } from "@/types/documentTemplate";
import { useRouter } from "next/navigation";
import { useDocumentTemplates } from "@/hooks/queryHooks/documentTemplates";
import { useDeleteDocumentTemplate, useSubmitForReview } from "@/hooks/queryHooks/documentTemplates";
import { useSnackbar } from "@/context/SnackbarContext";

/**
 * Shows the logged‑in user’s own templates (drafts, private, pending‑approval).
 * Provides:
 *  - “Create New Template” button (opens the builder)
 *  - Edit → redirects to the builder with `templateId`
 *  - Delete (with confirmation)
 *  - Submit for review (moves to pending queue)
 *  - Unsaved‑changes detection is handled inside the builder page,
 *    so here we only list the templates.
 */
export default function MyTemplatesSection() {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    // Load only the current user’s templates (the hook defaults to the logged‑in user)
    const { data, isLoading, refetch } = useDocumentTemplates();

    const deleteMutation = useDeleteDocumentTemplate();
    const submitMutation = useSubmitForReview();

    const handleCreate = () => {
        router.push("/dashboard/templates/builder?mode=create");
    };

    const handleEdit = (id: string) => {
        router.push(`/dashboard/templates/builder?mode=edit&templateId=${id}&source=user`);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this template?")) return;
        await deleteMutation.mutateAsync(id);
        showSnackbar("Template deleted", "success");
        refetch();
    };

    const handleSubmit = async (id: string) => {
        await submitMutation.mutateAsync(id);
        showSnackbar("Submitted for review", "info");
        refetch();
    };

    if (isLoading) {
        return (
            <Stack gap={2}>
                {[1, 2, 3].map((i) => (
                    <Paper key={i} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="60%" />
                    </Paper>
                ))}
            </Stack>
        );
    }

    const templates = data?.templates || [];

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                    My Templates
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={handleCreate}
                    sx={{ textTransform: "none", borderRadius: 2.5, fontWeight: 600 }}
                >
                    Create New Template
                </Button>
            </Stack>

            {templates.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
                    <Typography>No templates yet. Start by creating one.</Typography>
                </Paper>
            ) : (
                <Stack gap={2}>
                    {templates.map((tpl: DocumentTemplate) => (
                        <Paper
                            key={tpl.id}
                            elevation={0}
                            sx={{
                                p: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {tpl.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {tpl.isPublic ? "Public" : "Private"} • {tpl.approvalStatus ?? "Draft"}
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1}>
                                <IconButton onClick={() => handleEdit(tpl.id)} size="small" title="Edit">
                                    <Edit size={16} />
                                </IconButton>
                                {tpl.approvalStatus !== "approved" && (
                                    <IconButton onClick={() => handleSubmit(tpl.id)} size="small" title="Submit for Review">
                                        <ArrowRight size={16} />
                                    </IconButton>
                                )}
                                <IconButton onClick={() => handleDelete(tpl.id)} size="small" title="Delete" color="error">
                                    <Trash2 size={16} />
                                </IconButton>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
