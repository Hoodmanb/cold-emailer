"use client";

import React from "react";
import {
  Stack,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Building2, MapPin, Calendar, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import ScoreRing from "./ScoreRing";
import type { Job } from "@/types";
import { cardVariants, cardHoverVariants } from "@/motion/variants";

interface JobCardProps {
  job: Job;
  onDelete?: (id: string) => void;
}

export default function JobCard({ job, onDelete }: JobCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      style={{ borderRadius: 16, cursor: "default" }}
    >
      <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover" whileTap="tap">
        <Stack
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "16px",
            bgcolor: "background.paper",
            gap: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack gap={0.5} flex={1}>
              <Typography variant="h6" fontWeight={700} noWrap>
                {job.title || "Untitled Position"}
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Building2 size={14} color="#6b7280" />
                <Typography variant="body2" color="text.secondary">
                  {job.company || "Unknown Company"}
                </Typography>
              </Stack>
              <Stack direction="row" gap={1.5}>
                {job.location && (
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <MapPin size={12} color="#9ca3af" />
                    <Typography variant="caption" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Calendar size={12} color="#9ca3af" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            {job.atsScore !== null && job.atsScore !== undefined && (
              <ScoreRing score={job.atsScore} size={70} label="" />
            )}
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              <Chip
                label={`${job.linkedDocuments.length} docs`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
              <Chip
                label={`${job.linkedEmails.length} emails`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
            </Stack>
            <Stack direction="row" gap={0.5}>
              {onDelete && (
                <Tooltip title="Delete job">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(job.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Tooltip>
              )}
              <Link href={`/dashboard/jobs/${job.id}`}>
                <Tooltip title="View & generate documents">
                  <IconButton size="small" color="primary">
                    <motion.span
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.15 }}
                      style={{ display: "flex" }}
                    >
                      <ArrowRight size={14} />
                    </motion.span>
                  </IconButton>
                </Tooltip>
              </Link>
            </Stack>
          </Stack>
        </Stack>
      </motion.div>
    </motion.div>
  );
}
