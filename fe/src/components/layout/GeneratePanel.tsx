"use client";

import React, { useState } from "react";
import {
  Stack, Box, Typography, Button, LinearProgress, Alert,
  Checkbox, FormControlLabel, Chip, Divider, CircularProgress, Paper,
  Select, MenuItem, FormControl,
} from "@mui/material";
import {
  Sparkles, FileText, Mail, BarChart3, CheckCircle2,
  ChevronRight, RefreshCw, AlertTriangle, Edit3,
} from "lucide-react";
import {
  useRunATS, useGenerateSelected, validateAiFeaturesForTypes,
  type DocumentType, type DocumentFormat, type AtsResult, type PerDocFormats, type PerDocTemplateIds,
} from "@/hooks/queryHooks/workflow";
import TemplateSelector from "@/components/templates/TemplateSelector";
import type { TailoringLevel } from "@/types";
import { useSnackbar } from "@/context/SnackbarContext";
import { downloadAuthenticatedFile } from "@/utils/downloadUtils";
import DocumentEditModal from "@/components/documents/DocumentEditModal";
import TailoringSlider from "@/components/documents/TailoringSlider";
import axiosInstance from "@/hooks/axios";
import { useBillingStatus } from "@/hooks/queryHooks/billing";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { isAiConfigurationError } from "@/utils/parseApiError";
import { motion, AnimatePresence } from "framer-motion";
import { SPRINGS } from "@/motion/motionTokens";
import { slideUpVariants } from "@/motion/variants";


interface GeneratePanelProps {
  jobId: string;
  onComplete?: () => void;
}

type PanelStep = "idle" | "ats-running" | "ats-done" | "generating" | "done" | "error";

interface GeneratedDoc {
  id: string;
  type: string;
  format: string;
  title: string;
  editableContent?: string;
  content?: string;
}

const DOC_OPTIONS: { type: DocumentType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: "resume", label: "Resume", icon: <FileText size={16} />, description: "Concise ATS-tailored resume" },
  { type: "professional-cv", label: "Professional CV", icon: <FileText size={16} />, description: "Detailed multi-page CV" },
  { type: "cover-letter", label: "Cover Letter", icon: <FileText size={16} />, description: "Personalized pitch" },
  { type: "email", label: "Cold Email", icon: <Mail size={16} />, description: "Outreach email draft" },
];

const TAILORING_MULTIPLIERS: Record<TailoringLevel, number> = {
  conservative: 1,
  balanced: 1.2,
  aggressive: 1.5,
};

const FEATURE_BASE_COSTS: Partial<Record<DocumentType, number>> = {
  resume: 5,
  "professional-cv": 8,
  "cover-letter": 4,
  email: 4,
};

function estimateSelectionCost(types: DocumentType[], level: TailoringLevel) {
  const multiplier = TAILORING_MULTIPLIERS[level] ?? 1;
  return types.reduce((sum, type) => {
    const base = FEATURE_BASE_COSTS[type] ?? 1;
    return sum + Math.max(1, Math.ceil(base * multiplier));
  }, 0);
}

const DEFAULT_FORMATS: PerDocFormats = {
  resume: "pdf",
  "professional-cv": "docx",
  "cover-letter": "pdf",
  email: "txt",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "success.main" : score >= 50 ? "warning.main" : "error.main";
  const label = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Weak Match";
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={700} color={color}>{label}</Typography>
        <Typography variant="h5" fontWeight={900} color={color}>{score}<Typography component="span" variant="caption" color="text.secondary">/100</Typography></Typography>
      </Stack>
      <LinearProgress variant="determinate" value={score} sx={{ borderRadius: 4, height: 8, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: color } }} />
    </Box>
  );
}

export default function GeneratePanel({ jobId, onComplete }: GeneratePanelProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { data: billing } = useBillingStatus();
  const authUser = useAuthStore((s) => s.user);
  const isTokenUser = (billing?.billingType || authUser?.billingType) === "token";
  const creditBalance = billing?.credits ?? authUser?.credits ?? 0;
  const { runAts } = useRunATS();
  const { generate, loading: genLoading } = useGenerateSelected();

  const [step, setStep] = useState<PanelStep>("idle");
  const [ats, setAts] = useState<AtsResult | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(["resume", "cover-letter"]);
  const [docFormats, setDocFormats] = useState<PerDocFormats>({ ...DEFAULT_FORMATS });
  const [templateIds, setTemplateIds] = useState<PerDocTemplateIds>({});
  const [tailoringLevel, setTailoringLevel] = useState<TailoringLevel>("balanced");
  const [errorMsg, setErrorMsg] = useState("");
  const [isAiConfigError, setIsAiConfigError] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [editingDoc, setEditingDoc] = useState<GeneratedDoc | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleRunAts = async () => {
    setStep("ats-running");
    setErrorMsg("");
    setIsAiConfigError(false);
    try {
      const result = await runAts(jobId);
      setAts(result);
      setStep("ats-done");
    } catch (err: any) {
      const aiConfig = isAiConfigurationError(err) || err?.isAiConfig;
      setIsAiConfigError(Boolean(aiConfig));
      setErrorMsg(err.message || "ATS analysis failed");
      setStep("error");
    }
  };

  const toggleType = (type: DocumentType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const setFormatForType = (type: DocumentType, format: DocumentFormat) => {
    setDocFormats((prev) => ({ ...prev, [type]: format }));
  };

  const handleGenerate = async () => {
    if (!selectedTypes.length) {
      showSnackbar("Please select at least one document to generate", "warning");
      return;
    }
    setStep("generating");
    setErrorMsg("");
    setIsAiConfigError(false);
    try {
      const configError = await validateAiFeaturesForTypes(selectedTypes);
      if (configError) {
        setIsAiConfigError(true);
        setErrorMsg(configError);
        setStep("error");
        showSnackbar(`${configError} Open Settings → AI Workflows to configure.`, "error");
        return;
      }

      const formats: PerDocFormats = {};
      selectedTypes.forEach((t) => { formats[t] = docFormats[t] || "pdf"; });

      const result = await generate(jobId, selectedTypes, formats, tailoringLevel, undefined, templateIds);
      const docs: GeneratedDoc[] = [];
      if (result.resume) docs.push({ ...result.resume, format: formats.resume || "pdf" });
      if (result.professionalCv) docs.push({ ...result.professionalCv, format: formats["professional-cv"] || "pdf" });
      if (result.coverLetter) docs.push({ ...result.coverLetter, format: formats["cover-letter"] || "pdf" });
      if (result.emailDocument) docs.push({ ...result.emailDocument, format: formats.email || "txt" });

      setGeneratedDocs(docs);
      setStep("done");
      onComplete?.();
      showSnackbar(`Generated ${docs.length} document${docs.length !== 1 ? "s" : ""}`, "success");

      if (docs.length > 0) {
        setEditingDoc(docs[0]);
      }
    } catch (err: any) {
      const aiConfig = isAiConfigurationError(err) || err?.isAiConfig;
      setIsAiConfigError(Boolean(aiConfig));
      setErrorMsg(err.message || "Generation failed");
      setStep("error");
    }
  };

  const handleDownloadDoc = async (doc: GeneratedDoc) => {
    setDownloadingId(doc.id);
    try {
      const label = (doc.title || doc.type).replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 40);
      await downloadAuthenticatedFile(`/api/documents/${doc.id}/download`, `${label}.${doc.format}`, doc.format);
    } catch {
      showSnackbar("Download failed", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSaveDoc = async (id: string, updates: any) => {
    await axiosInstance.put(`/api/documents/${id}`, updates);
    showSnackbar("Document saved", "success");
    onComplete?.();
  };

  const reset = () => {
    setStep("idle");
    setAts(null);
    setSelectedTypes(["resume", "cover-letter"]);
    setDocFormats({ ...DEFAULT_FORMATS });
    setTailoringLevel("balanced");
    setErrorMsg("");
    setIsAiConfigError(false);
    setGeneratedDocs([]);
    setEditingDoc(null);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderColor: step === "done" ? "success.main" : "primary.main", borderWidth: 1.5 }}>
        <Stack gap={2.5}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Sparkles size={20} color="#3b82f6" />
            <Typography variant="subtitle1" fontWeight={800}>AI Document Generator</Typography>
          </Stack>

          {step === "idle" && (
            <Stack gap={2}>
              <Typography variant="body2" color="text.secondary">
                Run ATS analysis first, then choose documents, formats, and tailoring level.
              </Typography>
              <Button variant="contained" startIcon={<BarChart3 size={16} />} onClick={handleRunAts} fullWidth sx={{ fontWeight: 700, py: 1.5, borderRadius: 3 }}>
                Run ATS Analysis
              </Button>
            </Stack>
          )}

          {step === "ats-running" && (
            <Stack gap={2} alignItems="center" py={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">Analyzing job requirements and your profile match...</Typography>
              <LinearProgress sx={{ width: "100%", borderRadius: 4 }} />
            </Stack>
          )}

          {(step === "ats-done" || step === "done") && ats && (
            <Stack gap={2.5}>
              <ScoreBar score={ats.score} />

              {ats.missingKeywords.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Missing Keywords</Typography>
                  <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {ats.missingKeywords.slice(0, 8).map((kw) => (
                      <Chip key={kw} label={kw} size="small" color="warning" variant="outlined" sx={{ fontSize: "0.68rem" }} />
                    ))}
                  </Box>
                </Box>
              )}

              {step === "ats-done" && (
                <>
                  <Divider />
                  <TailoringSlider value={tailoringLevel} onChange={setTailoringLevel} />

                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Select Documents & Formats
                    </Typography>
                    <Stack gap={1} sx={{ mt: 1 }}>
                      {DOC_OPTIONS.map(({ type, label, icon, description }) => (
                        <Paper
                          key={type}
                          variant="outlined"
                          sx={{
                            px: 1.5, py: 1, borderRadius: 2,
                            borderColor: selectedTypes.includes(type) ? "primary.main" : "divider",
                            bgcolor: selectedTypes.includes(type) ? "primary.50" : "transparent",
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                            <FormControlLabel
                              control={<Checkbox size="small" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} sx={{ color: "primary.main" }} />}
                              label={
                                <Stack direction="row" alignItems="center" gap={1}>
                                  <Box color="primary.main">{icon}</Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>{label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{description}</Typography>
                                  </Box>
                                </Stack>
                              }
                              sx={{ m: 0, flex: 1 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 88 }} disabled={!selectedTypes.includes(type)}>
                              <Select
                                value={docFormats[type] || "pdf"}
                                onChange={(e) => setFormatForType(type, e.target.value as DocumentFormat)}
                                sx={{ fontSize: "0.75rem", borderRadius: 2, fontWeight: 700 }}
                              >
                                <MenuItem value="pdf">PDF</MenuItem>
                                <MenuItem value="docx">DOCX</MenuItem>
                                <MenuItem value="txt">TXT</MenuItem>
                              </Select>
                            </FormControl>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>

                  {selectedTypes.length > 0 && (
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Templates (Optional)
                      </Typography>
                      <Stack gap={2} sx={{ mt: 1 }}>
                        {selectedTypes.map((type) => {
                          const label = DOC_OPTIONS.find((d) => d.type === type)?.label || type;
                          return (
                            <Box key={type}>
                              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>{label}</Typography>
                              <TemplateSelector
                                compact
                                documentType={type}
                                value={templateIds[type] ?? null}
                                onChange={(id) => setTemplateIds((prev) => ({ ...prev, [type]: id }))}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {isTokenUser && selectedTypes.length > 0 && (
                    <Alert severity={creditBalance < estimateSelectionCost(selectedTypes, tailoringLevel) ? "warning" : "info"} sx={{ borderRadius: 2 }}>
                      Estimated cost: <strong>{estimateSelectionCost(selectedTypes, tailoringLevel)} credits</strong>
                      {" · "}Balance after: <strong>{Math.max(0, creditBalance - estimateSelectionCost(selectedTypes, tailoringLevel))}</strong>
                      {" · "}Current: <strong>{creditBalance}</strong>
                    </Alert>
                  )}

                  <Button variant="contained" startIcon={<ChevronRight size={16} />} onClick={handleGenerate} disabled={!selectedTypes.length || genLoading} fullWidth sx={{ fontWeight: 700, py: 1.5, borderRadius: 3 }}>
                    Generate {selectedTypes.length} Document{selectedTypes.length !== 1 ? "s" : ""}
                  </Button>
                </>
              )}

              {step === "done" && generatedDocs.length > 0 && (
                <>
                  <Divider />
                  <Alert severity="success" icon={<CheckCircle2 size={16} />} sx={{ py: 0.5, borderRadius: 2 }}>
                    Documents generated! Review and edit before exporting.
                  </Alert>
                  <Stack gap={1}>
                    {generatedDocs.map((doc) => (
                      <Stack key={doc.id} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" gap={1} alignItems="center">
                          <FileText size={14} />
                          <Typography variant="body2" fontWeight={600}>{doc.title || doc.type}</Typography>
                          <Chip label={doc.format.toUpperCase()} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                        </Stack>
                        <Stack direction="row" gap={0.5}>
                          <Button size="small" variant="contained" startIcon={<Edit3 size={12} />} onClick={() => setEditingDoc(doc)} sx={{ borderRadius: 2, fontSize: "0.7rem", py: 0.25 }}>
                            Edit
                          </Button>
                          <Button size="small" variant="outlined" disabled={downloadingId === doc.id} onClick={() => handleDownloadDoc(doc)} sx={{ borderRadius: 2, fontSize: "0.7rem", py: 0.25 }}>
                            {downloadingId === doc.id ? "..." : "Download"}
                          </Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                  <Button size="small" startIcon={<RefreshCw size={14} />} onClick={() => setStep("ats-done")} sx={{ fontWeight: 700 }}>
                    Generate More
                  </Button>
                </>
              )}
            </Stack>
          )}

          {step === "generating" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRINGS.soft}
              style={{ width: "100%" }}
            >
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "primary.main",
                  p: 3,
                  background: "linear-gradient(225deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)",
                  boxShadow: "0 4px 30px rgba(99, 102, 241, 0.05)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-150%",
                    width: "150%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1), transparent)",
                    animation: "shimmer 2.2s infinite linear",
                  },
                  "@keyframes shimmer": {
                    "0%": { left: "-150%" },
                    "100%": { left: "150%" },
                  }
                }}
              >
                <Stack gap={2.5} alignItems="center" py={1}>
                  <Box sx={{ color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={32} style={{ filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))" }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    AI Tailoring System Active...
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Generating optimized {selectedTypes.join(", ")} drafts using configured LLM models.
                  </Typography>
                  <LinearProgress sx={{ width: "100%", borderRadius: 4, height: 6, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "primary.main" } }} />
                  <Typography variant="caption" color="text.secondary">Editor will open automatically when ready.</Typography>
                </Stack>
              </Box>
            </motion.div>
          )}

          {step === "error" && (
            <Stack gap={2}>
              <Alert severity={isAiConfigError ? "warning" : "error"} icon={<AlertTriangle size={16} />} sx={{ borderRadius: 2 }}>
                {errorMsg || "Something went wrong."}
              </Alert>
              {isAiConfigError && (
                <Button
                  variant="contained"
                  onClick={() => router.push("/dashboard/settings")}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Open AI Settings
                </Button>
              )}
              <Button variant="outlined" startIcon={<RefreshCw size={14} />} onClick={reset} sx={{ borderRadius: 2, fontWeight: 700 }}>Try Again</Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <DocumentEditModal
        open={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        document={editingDoc}
        onSave={handleSaveDoc}
        autoSave
      />
    </>
  );
}
