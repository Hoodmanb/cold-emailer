"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import type { ProfileSkill } from "@/types";

type SkillPillsProps = {
  skills: ProfileSkill[];
  onSynced: () => Promise<void>;
};

const SKILLS_URL = "/api/profile/skills";

function isOk(res: { status: number; data?: { success?: boolean; message?: string } }) {
  if (res.status < 200 || res.status >= 300) return false;
  if (res.data?.success === false) return false;
  return true;
}

export interface SkillPillsHandle {
  openNew: () => void;
}

export const SkillPills = React.forwardRef<SkillPillsHandle, SkillPillsProps>(
  ({ skills, onSynced }, ref) => {
    const isMobile = useMediaQuery((t: any) => t.breakpoints.down("md"));
    const { showSnackbar } = useSnackbar();
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [expanded, setExpanded] = useState(false);
    
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<ProfileSkill | null>(null);
    const [editValue, setEditValue] = useState("");
    
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
      openNew: () => {
        setExpanded(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
    }));

    const LIMIT = 8;
    const hasMore = skills.length > LIMIT;
    const visibleSkills = expanded ? skills : skills.slice(0, LIMIT);

    const runSynced = async (res: { status: number; data?: unknown }) => {
      if (!isOk(res as any)) {
        const msg = (res.data as any)?.message || "Request failed";
        showSnackbar(msg, "error");
        return false;
      }
      await onSynced();
      return true;
    };

    const addSkill = async (raw: string) => {
      const t = raw.trim();
      if (!t || busy) return;
      setBusy(true);
      try {
        const res = await axiosInstance.post(SKILLS_URL, { name: t });
        if (await runSynced(res)) {
          setInput("");
          setExpanded(true);
        }
      } catch (e) {
        console.error(e);
        showSnackbar("Failed to add skill(s)", "error");
      } finally {
        setBusy(false);
      }
    };

    const removeSkill = async (skill: ProfileSkill) => {
      if (!confirm(`Remove "${skill.name}"?`)) return;
      setBusy(true);
      try {
        const res = await axiosInstance.delete(`${SKILLS_URL}/${encodeURIComponent(skill.id)}`);
        await runSynced(res);
      } catch (e) {
        console.error(e);
        showSnackbar("Failed to remove skill", "error");
      } finally {
        setBusy(false);
      }
    };

    const openEdit = (skill: ProfileSkill) => {
      setEditing(skill);
      setEditValue(skill.name);
      setEditOpen(true);
    };

    const saveEdit = async () => {
      if (!editing) return;
      const t = editValue.trim();
      if (!t || busy) return;
      setBusy(true);
      try {
        const res = await axiosInstance.put(`${SKILLS_URL}/${encodeURIComponent(editing.id)}`, { name: t });
        if (await runSynced(res)) {
          setEditOpen(false);
          setEditing(null);
        }
      } catch (e) {
        console.error(e);
        showSnackbar("Failed to update skill", "error");
      } finally {
        setBusy(false);
      }
    };

    return (
      <Stack gap={1.5}>
        {hasMore && (
          <Stack direction="row" justifyContent="flex-end">
            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, fontWeight: 700, fontSize: "0.75rem" }} onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : `View all (+${skills.length - LIMIT})`}
            </Button>
          </Stack>
        )}

        {skills.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            No skills added yet. Use commas for bulk entry.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {visibleSkills.map((skill) => (
              <Box
                key={skill.id}
                className="skill-pill-root"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  pl: 1,
                  pr: 0.25,
                  py: 0.25,
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "primary.light", bgcolor: "action.hover" },
                }}
              >
                <Typography variant="caption" fontWeight={500} sx={{ color: "text.primary", userSelect: "none" }}>
                  {skill.name}
                </Typography>
                <Stack direction="row" className="skill-actions" sx={{ opacity: { xs: 1, md: 0 }, transition: "opacity 0.2s", ".skill-pill-root:hover &": { opacity: 1 } }}>
                  <IconButton size="small" onClick={() => openEdit(skill)} disabled={busy} sx={{ p: 0.25, ml: 0.5 }}>
                    <Pencil size={12} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => removeSkill(skill)} disabled={busy} sx={{ p: 0.25 }}>
                    <Trash2 size={12} />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>
        )}

        <TextField
          size="small"
          fullWidth
          inputRef={inputRef}
          placeholder="Add skills (e.g. React, Node, AI)"
          value={input}
          disabled={busy}
          autoComplete="off"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void addSkill(input))}
          InputProps={{
            sx: { borderRadius: 2, fontSize: "0.85rem", bgcolor: "background.paper" },
            endAdornment: busy ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <IconButton size="small" onClick={() => addSkill(input)} disabled={!input.trim()} sx={{ mr: 0.5 }}>
                <Plus size={18} />
              </IconButton>
            ),
          }}
        />

        <Dialog open={editOpen} onClose={() => !busy && setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Edit skill</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              disabled={busy}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void saveEdit()}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} disabled={busy} size="small">
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void saveEdit()} disabled={!editValue.trim() || busy} size="small" sx={{ borderRadius: 2 }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }
);

SkillPills.displayName = "SkillPills";
