"use client";

import React, { useState } from "react";
import { Stack, Box, Typography, Button, LinearProgress, Alert } from "@mui/material";
import { Sparkles, FileText, Mail, BarChart3, CheckCircle2 } from "lucide-react";
import { useRunWorkflow } from "@/hooks/queryHooks";
import { useSnackbar } from "@/context/SnackbarContext";
import type { WorkflowResult } from "@/types";

interface GeneratePanelProps {
  jobId: string;
  onComplete?: (result: WorkflowResult) => void;
}

const STEPS = [
  { icon: <BarChart3 size={14} />, label: "Parsing job description" },
  { icon: <BarChart3 size={14} />, label: "Calculating ATS score" },
  { icon: <FileText size={14} />, label: "Generating resume draft" },
  { icon: <FileText size={14} />, label: "Generating cover letter draft" },
  { icon: <Mail size={14} />, label: "Generating cold email draft" },
  { icon: <CheckCircle2 size={14} />, label: "Scoring email quality" },
];

export default function GeneratePanel({ jobId, onComplete }: GeneratePanelProps) {
  const { showSnackbar } = useSnackbar();
  const { run, loading } = useRunWorkflow();
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<WorkflowResult | null>(null);

  const handleGenerate = async () => {
    setResult(null);
    try {
      // Simulate step progress
      for (let i = 0; i < STEPS.length; i++) {
        setCurrentStep(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      const res = await run(jobId);
      setResult(res);
      setCurrentStep(-1);
      onComplete?.(res);
      showSnackbar("All documents generated as drafts!", "success");
    } catch (err: any) {
      setCurrentStep(-1);
      showSnackbar(err.message || "Workflow failed", "error");
    }
  };

  return (
    <Stack
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: "primary.main",
        borderRadius: "16px",
        bgcolor: "primary.50",
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Sparkles size={20} color="#3b82f6" />
        <Typography variant="subtitle1" fontWeight={700}>
          Generate All Documents
        </Typography>
      </Stack>

      <Alert severity="info" sx={{ py: 0.5 }}>
        AI model/provider are now controlled by feature mapping in Settings.
      </Alert>

      {loading && (
        <Stack gap={1.5}>
          <LinearProgress sx={{ borderRadius: 4 }} />
          {STEPS.map((step, i) => (
            <Stack key={i} direction="row" alignItems="center" gap={1}>
              <Box sx={{ color: i <= currentStep ? "primary.main" : "text.disabled" }}>{step.icon}</Box>
              <Typography
                variant="caption"
                color={i === currentStep ? "primary.main" : i < currentStep ? "success.main" : "text.disabled"}
                fontWeight={i === currentStep ? 700 : 400}
              >
                {i < currentStep ? "“ " : ""}{step.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {result && !loading && (
        <Alert severity="success" sx={{ py: 0.5 }}>
          Generated in {(result.durationMs / 1000).toFixed(1)}s ATS Score: {result.ats.score}/100
        </Alert>
      )}

      <Alert severity="info" sx={{ py: 0.5, fontSize: "0.75rem" }}>
        All outputs start as <strong>drafts</strong>. Review and approve before sending.
      </Alert>

      <Button
        variant="contained"
        size="large"
        startIcon={<Sparkles size={16} />}
        onClick={handleGenerate}
        disabled={loading}
        fullWidth
        sx={{ fontWeight: 700, py: 1.5 }}
      >
        {loading ? "Generating..." : "Generate All Drafts"}
      </Button>
    </Stack>
  );
}
