"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardActionArea,
  Grid,
  Checkbox,
  FormControlLabel,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Divider,
  Paper,
  Fade,
  Chip
} from "@mui/material";
import {
  X,
  FileText,
  Briefcase,
  FolderKanban,
  Award,
  User,
  Target,
  Layout,
  Download,
  Mail,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { useProductivity } from "@/context/ProductivityContext";
import { useGetProfile } from "@/hooks/queryHooks";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { downloadAuthenticatedFile } from "@/utils/downloadUtils";
import TemplateSelector from "@/components/templates/TemplateSelector";
import { useRouter } from "next/navigation";
import { isAiConfigurationError, parseApiError } from "@/utils/parseApiError";
import Alert from "@mui/material/Alert";

type ResumeTemplateMeta = { id: string; label: string; description?: string; file?: string; isDefault?: boolean };

function parseFilenameFromDisposition(header: string | undefined, fallback: string) {
  if (!header) return fallback;
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  return (m?.[1] || fallback).replace(/"/g, "").trim();
}

function buildResumeExportModel(
  profile: Record<string, any>,
  contactFields: { phone: boolean; github: boolean; linkedin: boolean; email: boolean },
  selectedExperience: string[],
  selectedSkills: string[],
  selectedCerts: string[]
) {
  const allExp = profile.experience || [];
  const expIds =
    selectedExperience.length > 0 ? selectedExperience : allExp.map((e: { id: string }) => e.id).filter(Boolean);
  const experience = allExp
    .filter((e: { id: string }) => expIds.includes(e.id))
    .map((e: Record<string, any>) => {
      const bullets =
        Array.isArray(e.achievements) && e.achievements.length > 0
          ? e.achievements.map(String)
          : e.description
            ? String(e.description)
              .split(/\n+/)
              .map((s: string) => s.trim())
              .filter(Boolean)
              .slice(0, 14)
            : [];
      return {
        title: e.title || "",
        company: e.company || "",
        location: e.location || "",
        startDate: e.startDate || "",
        endDate: e.current ? "Present" : e.endDate || "",
        bullets,
      };
    });

  const allSkills = profile.skills || [];
  const skillNames =
    selectedSkills.length > 0
      ? selectedSkills
      : allSkills.map((s: { name?: string }) => s.name).filter(Boolean);

  const allCerts = profile.certificates || [];
  const certIds =
    selectedCerts.length > 0 ? selectedCerts : allCerts.map((c: { id: string }) => c.id).filter(Boolean);
  const certifications = allCerts
    .filter((c: { id: string }) => certIds.includes(c.id))
    .map((c: Record<string, any>) => c.title || c.awarder || String(c.id));

  const education = (profile.education || []).map((ed: Record<string, any>) => ({
    degree: ed.degree || "",
    institution: ed.institution || ed.school || "",
    year: ed.endDate || ed.year || "",
    gpa: ed.gpa || "",
  }));

  return {
    contact: {
      name: profile.name || "",
      email: contactFields.email ? profile.email || "" : "",
      phone: contactFields.phone ? profile.phoneNumber || profile.phone || "" : "",
      location: profile.location || "",
      linkedin: contactFields.linkedin ? profile.linkedinUrl || "" : "",
      website: contactFields.github ? profile.githubUrl || "" : "",
    },
    summary: (profile.summary && String(profile.summary).trim()) || "—",
    experience,
    education,
    skills: skillNames,
    certifications,
    atsKeywords: [] as string[],
  };
}

const DOC_TYPES = [
  { id: "resume", label: "Professional Resume", icon: <FileText />, desc: "ATS-optimized standard resume" },
  { id: "professional-cv", label: "Professional CV", icon: <Award />, desc: "Detailed multi-page professional CV" },
  { id: "cover-letter", label: "Cover Letter", icon: <Mail />, desc: "Targeted application letter" },
  { id: "portfolio", label: "Visual Portfolio", icon: <Layout />, desc: "Showcase projects and skills" },
  { id: "case-study", label: "Project Case Study", icon: <FolderKanban />, desc: "Deep dive into one project" },
  { id: "proposal", label: "Client Proposal", icon: <Target />, desc: "Freelance or project pitch" },
  { id: "career-summary", label: "Career Summary", icon: <User />, desc: "Executive bio or summary" },
];

const STYLES = ["Modern", "Minimalist", "Creative", "Corporate", "Technical"];
const AUDIENCES = ["Recruiter", "Technical Manager", "CEO/Founder", "Potential Client", "General"];

const AI_GENERATION_TIMEOUT_MS = 120_000;

function resolveFeatureIdForDocType(docType: string): string {
  const t = String(docType || "").toLowerCase().replace(/\s+/g, "-");
  if (t.includes("professional-cv") || t === "cv") return "professional_cv_generation";
  if (t.includes("cover-letter")) return "cover_letter_generation";
  if (t === "resume") return "resume_generation";
  return "advanced_doc_generation";
}

async function validateAiFeatureReady(featureId: string): Promise<string | null> {
  try {
    await axiosInstance.get(`/api/settings/ai/validate-feature/${encodeURIComponent(featureId)}`, {
      timeout: 15_000,
      headers: { "X-Bypass-Global-Toast": "true" },
    });
    return null;
  } catch (err: any) {
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      "AI is not configured for this document type. Set up your provider and model in Settings → AI Workflows."
    );
  }
}

export default function DocumentGeneratorModal() {
  const router = useRouter();
  const { activeModal, closeModal, openModal, modalData } = useProductivity();
  const isOpen = activeModal === "generator";
  const { profile, loading: loadingProfile } = useGetProfile();
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState(0);
  const [docType, setDocType] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [contactFields, setContactFields] = useState({
    phone: true,
    github: true,
    linkedin: true,
    email: true,
  });

  const [style, setStyle] = useState("Modern");
  const [audience, setAudience] = useState("Recruiter");
  const [customInstructions, setCustomInstructions] = useState("");
  const [format, setFormat] = useState("pdf");
  const [templateId, setTemplateId] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);
  const [resumeTemplates, setResumeTemplates] = useState<ResumeTemplateMeta[]>([]);
  const [resumeTemplateId, setResumeTemplateId] = useState<string>("random");
  const [lastResumeBlob, setLastResumeBlob] = useState<Blob | null>(null);
  const [lastResumeFilename, setLastResumeFilename] = useState<string>("");
  const [generateError, setGenerateError] = useState<{ message: string; isAiConfig: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setDocType("");
      setSelectedProjects([]);
      setSelectedExperience([]);
      setSelectedCerts([]);
      setSelectedSkills([]);
      setGeneratedDoc(null);
      setResumeTemplateId("random");
      setTemplateId(null);
      setLastResumeBlob(null);
      setLastResumeFilename("");
      setGenerateError(null);
      return;
    }
    if (modalData?.docType) {
      setDocType(modalData.docType);
      if (modalData.preselect) setActiveStep(0);
    }
    if (modalData?.templateId) {
      setTemplateId(String(modalData.templateId));
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/api/documents/resume-templates");
        if (!cancelled && res.data?.success && Array.isArray(res.data.data)) {
          setResumeTemplates(res.data.data);
        }
      } catch {
        /* templates optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, modalData?.docType]);
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleGenerate = async () => {
    console.log("[GENERATOR] Starting generation process...");

    if (!profile) {
      showSnackbar("Profile details not loaded yet. Please wait.", "warning");
      return;
    }

    // Validation
    if (!docType) {
      showSnackbar("Please select a document type first.", "warning");
      setActiveStep(0);
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    try {
      const usesTemplatedResumeExport =
        docType === "resume" && ["pdf", "html", "docx"].includes(format);

      if (!usesTemplatedResumeExport) {
        const featureId = resolveFeatureIdForDocType(docType);
        const configError = await validateAiFeatureReady(featureId);
        if (configError) {
          setGenerateError({ message: configError, isAiConfig: true });
          showSnackbar(configError, "error");
          return;
        }
      }

      if (usesTemplatedResumeExport) {
        if (!profile?.name?.trim()) {
          showSnackbar("Add your name in your profile before exporting a resume.", "warning");
          setGenerating(false);
          return;
        }
        const model = buildResumeExportModel(
          profile,
          contactFields,
          selectedExperience,
          selectedSkills,
          selectedCerts
        );
        const res = await axiosInstance.post(
          "/api/documents/render-resume",
          { model, format, resumeTemplateId },
          { responseType: "blob" }
        );
        const disposition = res.headers["content-disposition"] as string | undefined;
        const fallbackName = `resume_${resumeTemplateId === "random" ? "random" : resumeTemplateId}.${format}`;
        const fname = parseFilenameFromDisposition(disposition, fallbackName);
        const mime = (res.headers["content-type"] as string) || "application/octet-stream";
        const blob = new Blob([res.data], { type: mime });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setLastResumeBlob(blob);
        setLastResumeFilename(fname);
        setGeneratedDoc({
          id: "resume-export",
          type: "resume",
          content: `Your **${format.toUpperCase()}** was generated using ${resumeTemplateId === "random" ? "a **random** layout" : `layout **${resumeTemplateId}**`
            } and downloaded to your device.`,
          templatedResume: true,
        });
        showSnackbar("Resume downloaded", "success");
        handleNext();
        return;
      }

      const userData = {
        name: profile.name,
        email: contactFields.email ? profile.email : null,
        phone: contactFields.phone ? (profile.phoneNumber || profile.phone) : null,
        github: contactFields.github ? profile.githubUrl : null,
        linkedin: contactFields.linkedin ? profile.linkedinUrl : null,
        summary: profile.summary,
        experience: profile.experience?.filter(e => selectedExperience.includes(e.id)) || [],
        projects: profile.projects?.filter(p => selectedProjects.includes(p.id)) || [],
        certificates: profile.certificates?.filter(c => selectedCerts.includes(c.id)) || [],
        skills: profile.skills?.filter(s => selectedSkills.includes(s.name)) || [],
      };

      console.log("[GENERATOR] Payload Prepared:", {
        docType,
        selectedExperience: selectedExperience.length,
        selectedProjects: selectedProjects.length,
        selectedSkills: selectedSkills.length,
        selectedCerts: selectedCerts.length,
        format
      });

      const payload = {
        docType: DOC_TYPES.find(d => d.id === docType)?.label || docType,
        userData,
        targetAudience: audience,
        templateStyle: style,
        additionalInstructions: customInstructions,
        format,
        templateId: templateId || undefined,
      };

      console.log("[GENERATOR] Sending request to /api/documents/generate-advanced", payload);

      const res = await axiosInstance.post("/api/documents/generate-advanced", payload, {
        timeout: AI_GENERATION_TIMEOUT_MS,
        headers: { "X-Bypass-Global-Toast": "true" },
      });

      console.log("[GENERATOR] Response received:", res.data);

      if (res.data?.success) {
        setGeneratedDoc(res.data.data);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        showSnackbar("Document generated and saved to Documents!", "success");
        handleNext();
      } else {
        throw new Error(res.data?.message || "Generation failed on server");
      }
    } catch (err: any) {
      console.error("[GENERATOR] Error:", err);
      const aiConfig = isAiConfigurationError(err);
      const msg = parseApiError(err);
      setGenerateError({
        message: msg,
        isAiConfig: aiConfig,
      });
      showSnackbar(
        aiConfig ? `${msg} Open Settings → AI Workflows to configure.` : msg,
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAttachToMail = () => {
    openModal("mail", { attachments: [generatedDoc] });
  };

  const steps = ["Select Type", "Select Template", "Select Data", "Refine Style", "Generate"];

  if (!isOpen) return null;

  if (loadingProfile || !profile) {
    return (
      <Dialog
        open={isOpen}
        onClose={closeModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogContent sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">Loading profile context...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, height: "90vh", display: "flex", flexDirection: "column" }
      }}
    >
      <DialogTitle sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "warning.lighter", color: "warning.main" }}>
            <Sparkles size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              Smart Document Generator
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create professional career assets using AI
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={closeModal} disabled={generating}><X /></IconButton>
      </DialogTitle>
      {generating && <LinearProgress sx={{ height: 2 }} />}

      <DialogContent sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 4 }}>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              {DOC_TYPES.map((type) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={type.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      borderColor: docType === type.id ? "primary.main" : "divider",
                      bgcolor: docType === type.id ? "primary.lighter" : "background.paper",
                      transition: "all 0.2s"
                    }}
                  >
                    <CardActionArea sx={{ p: 3 }} onClick={() => setDocType(type.id)}>
                      <Box sx={{ color: docType === type.id ? "primary.main" : "text.secondary", mb: 2 }}>
                        {React.cloneElement(type.icon as React.ReactElement, { size: 32 })}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>{type.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{type.desc}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {activeStep === 1 && (
            <Stack gap={2}>
              <Typography variant="subtitle2" fontWeight={800}>
                Choose a document template (optional)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Templates guide AI structure and formatting. Skip to use the default generation flow.
              </Typography>
              <TemplateSelector
                documentType={docType}
                value={templateId}
                onChange={(id) => setTemplateId(id)}
                showTypeFilter
              />
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack gap={4}>
              {/* Contact Info Toggles */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={18} /> CONTACT INFORMATION
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {Object.entries(contactFields).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      color={value ? "primary" : "default"}
                      onClick={() => setContactFields(prev => ({ ...prev, [key]: !value }))}
                      variant={value ? "filled" : "outlined"}
                      sx={{ borderRadius: 2, px: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Experience Selection */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Briefcase size={18} /> WORK EXPERIENCE
                  </Typography>
                  {profile.experience && profile.experience.length > 0 && (
                    <Chip
                      size="small"
                      label={selectedExperience.length === (profile.experience?.length ?? 0) ? "Deselect All" : "Select All"}
                      onClick={() => selectedExperience.length === (profile.experience?.length ?? 0) ? setSelectedExperience([]) : setSelectedExperience(profile.experience?.map(e => e.id) ?? [])}
                    />
                  )}
                </Box>
                {profile.experience?.length ? (
                  <Grid container spacing={2}>
                    {profile.experience.map((exp) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={exp.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: selectedExperience.includes(exp.id) ? "primary.main" : "divider",
                            bgcolor: selectedExperience.includes(exp.id) ? "primary.lighter" : "background.paper",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            if (selectedExperience.includes(exp.id)) setSelectedExperience(selectedExperience.filter(id => id !== exp.id));
                            else setSelectedExperience([...selectedExperience, exp.id]);
                          }}
                        >
                          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>{exp.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{exp.company} • {exp.startDate} - {exp.current ? "Present" : exp.endDate}</Typography>
                            </Box>
                            <Checkbox
                              checked={selectedExperience.includes(exp.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) setSelectedExperience([...selectedExperience, exp.id]);
                                else setSelectedExperience(selectedExperience.filter(id => id !== exp.id));
                              }}
                            />
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>No experience records found.</Typography>
                )}
              </Box>

              <Divider />

              {/* Projects Selection */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FolderKanban size={18} /> PROJECTS
                  </Typography>
                  {profile.projects && profile.projects.length > 0 && (
                    <Chip
                      size="small"
                      label={selectedProjects.length === (profile.projects?.length ?? 0) ? "Deselect All" : "Select All"}
                      onClick={() => selectedProjects.length === (profile.projects?.length ?? 0) ? setSelectedProjects([]) : setSelectedProjects(profile.projects?.map(p => p.id) ?? [])}
                    />
                  )}
                </Box>
                {profile.projects?.length ? (
                  <Grid container spacing={2}>
                    {profile.projects.map((proj) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={proj.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: selectedProjects.includes(proj.id) ? "primary.main" : "divider",
                            bgcolor: selectedProjects.includes(proj.id) ? "primary.lighter" : "background.paper",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            if (selectedProjects.includes(proj.id)) setSelectedProjects(selectedProjects.filter(id => id !== proj.id));
                            else setSelectedProjects([...selectedProjects, proj.id]);
                          }}
                        >
                          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>{proj.title}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {proj.description}
                              </Typography>
                            </Box>
                            <Checkbox
                              checked={selectedProjects.includes(proj.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) setSelectedProjects([...selectedProjects, proj.id]);
                                else setSelectedProjects(selectedProjects.filter(id => id !== proj.id));
                              }}
                            />
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>No projects found.</Typography>
                )}
              </Box>

              <Divider />

              {/* Skills Selection */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Sparkles size={18} /> SKILLS
                </Typography>
                {profile.skills && profile.skills.length > 0 && (
                  <Chip
                    size="small"
                    label={selectedSkills.length === (profile.skills?.length ?? 0) ? "Deselect All" : "Select All"}
                    onClick={() => selectedSkills.length === (profile.skills?.length ?? 0) ? setSelectedSkills([]) : setSelectedSkills(profile.skills?.map(s => s.name) ?? [])}
                  />
                )}
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {profile.skills?.map((skill) => (
                    <Chip
                      key={skill.id || skill.name}
                      label={skill.name}
                      color={selectedSkills.includes(skill.name) ? "primary" : "default"}
                      onClick={() => {
                        if (selectedSkills.includes(skill.name)) setSelectedSkills(selectedSkills.filter(s => s !== skill.name));
                        else setSelectedSkills([...selectedSkills, skill.name]);
                      }}
                      variant={selectedSkills.includes(skill.name) ? "filled" : "outlined"}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                  {!profile.skills?.length && <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>No skills listed.</Typography>}
                </Stack>
              </Box>

              <Divider />

              {/* Certificates Selection */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Award size={18} /> CERTIFICATES
                  </Typography>
                  {profile.certificates && profile.certificates.length > 0 && (
                    <Chip
                      size="small"
                      label={selectedCerts.length === (profile.certificates?.length ?? 0) ? "Deselect All" : "Select All"}
                      onClick={() => selectedCerts.length === (profile.certificates?.length ?? 0) ? setSelectedCerts([]) : setSelectedCerts(profile.certificates?.map(c => c.id) ?? [])}
                    />
                  )}

                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {profile.certificates?.map((cert) => (
                      <Chip
                        key={cert.id}
                        label={cert.title || cert.awarder}
                        color={selectedCerts.includes(cert.id) ? "primary" : "default"}
                        onClick={() => {
                          if (selectedCerts.includes(cert.id)) setSelectedCerts(selectedCerts.filter(id => id !== cert.id));
                          else setSelectedCerts([...selectedCerts, cert.id]);
                        }}
                        variant={selectedCerts.includes(cert.id) ? "filled" : "outlined"}
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                    {!profile.certificates?.length && <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>No certificates found.</Typography>}
                  </Stack>
                </Box>
              </Box>
            </Stack>
          )}

          {activeStep === 3 && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack gap={4}>
                  {/* Format Selection */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} gutterBottom>OUTPUT FORMAT</Typography>
                    <Grid container spacing={2}>
                      {[
                        { id: "pdf", label: "PDF", desc: "Best for sharing & applying", icon: <FileText size={18} /> },
                        { id: "docx", label: "Word", desc: "Editable structure", icon: <FileText size={18} /> },
                        { id: "html", label: "HTML", desc: "Web preview", icon: <Layout size={18} /> },
                        { id: "markdown", label: "Markdown", desc: "Developer friendly", icon: <FileText size={18} /> },
                        { id: "txt", label: "Plain Text", desc: "Simple text only", icon: <FileText size={18} /> },
                        { id: "json", label: "JSON", desc: "Raw data structure", icon: <FileText size={18} /> },
                      ].map((f) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={f.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 3,
                              borderColor: format === f.id ? "primary.main" : "divider",
                              bgcolor: format === f.id ? "primary.lighter" : "background.paper",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              textAlign: "center",
                              p: 2
                            }}
                            onClick={() => setFormat(f.id)}
                          >
                            <Box sx={{ color: format === f.id ? "primary.main" : "text.secondary", mb: 1 }}>
                              {f.icon}
                            </Box>
                            <Typography variant="body2" fontWeight={800}>{f.label}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "10px" }}>{f.desc}</Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {docType === "resume" && ["pdf", "html", "docx"].includes(format) && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                        RESUME LAYOUT
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        PDF, HTML, and Word use structured templates from your profile. Pick a style or use random.
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        label="Template"
                        value={resumeTemplateId}
                        onChange={(e) => setResumeTemplateId(e.target.value)}
                      >
                        <MenuItem value="random">Random (pick a layout each time)</MenuItem>
                        {resumeTemplates.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.label}
                            {t.description ? ` — ${t.description}` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Template Style"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        {STYLES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Target Audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      >
                        {AUDIENCES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Custom AI Instructions"
                    placeholder="e.g. Focus on my leadership experience or keep it under one page..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "action.hover", height: "100%" }}>
                  <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Sparkles size={18} /> GENERATION SUMMARY
                  </Typography>
                  <Stack gap={2} sx={{ mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Document Type</Typography>
                      <Typography variant="body2" fontWeight={700}>{DOC_TYPES.find(d => d.id === docType)?.label}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Output Format</Typography>
                      <Typography variant="body2" fontWeight={700}>{format.toUpperCase()}</Typography>
                    </Box>
                    {docType === "resume" && ["pdf", "html", "docx"].includes(format) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Resume layout</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {resumeTemplateId === "random"
                            ? "Random"
                            : resumeTemplates.find((t) => t.id === resumeTemplateId)?.label || resumeTemplateId}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">Included Content</Typography>
                      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {selectedExperience.length > 0 && <Chip size="small" label={`${selectedExperience.length} Experience`} />}
                        {selectedProjects.length > 0 && <Chip size="small" label={`${selectedProjects.length} Projects`} />}
                        {selectedSkills.length > 0 && <Chip size="small" label={`${selectedSkills.length} Skills`} />}
                        {selectedCerts.length > 0 && <Chip size="small" label={`${selectedCerts.length} Certs`} />}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Contact Fields</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {Object.entries(contactFields).filter(([_, v]) => v).map(([k]) => k).join(", ") || "None"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 4, p: 2, bgcolor: "primary.main", color: "white", borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Ready to generate?</Typography>
                    <Typography variant="body2" fontWeight={800}>Estimated time: ~10-15s</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeStep === 4 && generatedDoc && (
            <Fade in>
              <Box>
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, mb: 3, boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
                  <Typography variant="h5" fontWeight={800} gutterBottom sx={{ borderBottom: "2px solid", borderColor: "primary.main", pb: 1, mb: 3 }}>
                    {generatedDoc.type.toUpperCase()}
                  </Typography>
                  <Box className="markdown-content">
                    <ReactMarkdown>{generatedDoc.content}</ReactMarkdown>
                  </Box>
                </Paper>
                <Stack direction="row" justifyContent="center" gap={2}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    size="large"
                    onClick={async () => {
                      try {
                        if (generatedDoc?.templatedResume && lastResumeBlob) {
                          const url = window.URL.createObjectURL(lastResumeBlob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = lastResumeFilename || `resume.${format}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          showSnackbar("Download started", "success");
                          return;
                        }
                        const filename = `${generatedDoc.type}_${generatedDoc.id}.${format}`;
                        await downloadAuthenticatedFile(
                          `/api/documents/${generatedDoc.id}/download`,
                          filename,
                          format
                        );
                        showSnackbar("Download started", "success");
                      } catch (err) {
                        showSnackbar("Download failed", "error");
                      }
                    }}
                  >
                    Download {format.toUpperCase()}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Mail />}
                    size="large"
                    onClick={handleAttachToMail}
                    disabled={Boolean(generatedDoc?.templatedResume)}
                  >
                    Attach to Email
                  </Button>
                </Stack>
              </Box>
            </Fade>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "background.paper" }}>
          {generateError && activeStep >= 3 && (
            <Alert
              severity={generateError.isAiConfig ? "warning" : "error"}
              action={
                generateError.isAiConfig ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      closeModal();
                      router.push("/dashboard/settings");
                    }}
                  >
                    Open AI Settings
                  </Button>
                ) : undefined
              }
            >
              {generateError.message}
            </Alert>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            startIcon={<ChevronLeft />}
            onClick={handleBack}
            disabled={activeStep === 0 || generating}
          >
            Back
          </Button>

          {activeStep < 3 ? (
            <Button
              variant="contained"
              endIcon={<ChevronRight />}
              onClick={handleNext}
              disabled={activeStep === 0 && !docType}
            >
              Continue
            </Button>
          ) : activeStep === 3 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <Sparkles />}
              sx={{ px: 4 }}
            >
              {generating
                ? "Crafting document…"
                : docType === "resume" && ["pdf", "html", "docx"].includes(format)
                  ? "Generate resume"
                  : "Generate with AI"}
            </Button>
          ) : (
            <Button variant="outlined" onClick={closeModal}>Finish</Button>
          )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
