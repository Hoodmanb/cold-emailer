"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Stack,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert, Divider,
  Link as MuiLink,
  Grid,
} from "@mui/material";
import NextLink from "next/link";
import { User2, Save, GraduationCap, Briefcase, FolderKanban, Award, ShieldCheck, Github, Linkedin, MessageSquare, ExternalLink } from "lucide-react";
import { useGetProfile, useProjects } from "@/hooks/queryHooks";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { SkillPills, type SkillPillsHandle } from "@/components/profile/SkillPills";
import { ProjectsSection, type ProjectsSectionHandle } from "@/components/profile/ProjectsSection";
import { CollapsibleSection } from "@/components/profile/CollapsibleSection";
import { ExperienceSection, type ExperienceSectionHandle } from "@/components/profile/ExperienceSection";
import { CertificatesSection, type CertificatesSectionHandle } from "@/components/profile/CertificatesSection";
import type { ProfileSkill, WorkExperience, Certificate } from "@/types";

// Shape of a partial profile update used by saveProfilePartial
type ProfilePartial = Partial<{
  name: string;
  email: string;
  summary: string;
  phoneNumber: string;
  githubUrl: string;
  linkedinUrl: string;
  experience: WorkExperience[];
  projects: any[]; // project type can be refined if available
  certificates: Certificate[];
  skills: ProfileSkill[];
}>;

function coerceProfileSkills(raw: unknown): ProfileSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: ProfileSkill[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    if (typeof s === "string") {
      const name = s.trim();
      if (name) out.push({ id: `legacy-${i}-${name}`, name });
      continue;
    }
    if (s && typeof s === "object" && "name" in s) {
      const name = String((s as { name: unknown }).name || "").trim();
      const id = String((s as { id?: unknown }).id || "").trim();
      if (name) out.push({ id: id || name, name });
    }
  }
  return out;
}

export default function ProfilePage() {
  const { profile, loading, error, refetch } = useGetProfile();
  const { data: projects = [] } = useProjects();
  const { showSnackbar } = useSnackbar();

  const expRef = useRef<ExperienceSectionHandle>(null);
  const projRef = useRef<ProjectsSectionHandle>(null);
  const skillRef = useRef<SkillPillsHandle>(null);
  const certRef = useRef<CertificatesSectionHandle>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    summary: "",
    phoneNumber: "",
    githubUrl: "",
    linkedinUrl: "",
  });
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const skills = useMemo(() => coerceProfileSkills(profile?.skills), [profile?.skills]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        summary: profile.summary || "",
        phoneNumber: profile.phoneNumber || "",
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
      });
      setExperience(profile.experience || []);
      setCertificates(profile.certificates || []);
    }
  }, [profile]);

  // Helper to persist full profile after section changes
  const saveProfilePartial = async (partial: ProfilePartial) => {
    setSavingProfile(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        summary: form.summary,
        phoneNumber: form.phoneNumber,
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
        experience,
        projects,
        certificates,
        skills,
        ...partial,
      };
      const res = await axiosInstance.put('/api/profile', payload);
      if (res.status >= 200 && res.status < 300 && (res.data?.success || res.status === 200)) {
        showSnackbar('Profile saved', 'success');
        await refetch();
      } else {
        showSnackbar(res.data?.message || 'Failed to save profile', 'error');
      }
    } catch (e) {
      console.error(e);
      showSnackbar('Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCertificatesChange = async (newCertificates: Certificate[]) => {
    setCertificates(newCertificates);
    await saveProfilePartial({ certificates: newCertificates });
  };
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Stack gap={3} maxWidth={900} mx="auto" px={{ xs: 2, sm: 3 }} py={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: "text.primary", letterSpacing: "-0.5px" }}>
            Career Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your professional identity and AI context
          </Typography>
        </Box>

      </Stack>

      {error ? (
        <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {error}
        </Alert>
      ) : null}

      <Alert
        severity="info"
        icon={<User2 size={20} />}
        sx={{
          borderRadius: 3,
          bgcolor: "primary.lighter",
          color: "primary.dark",
          "& .MuiAlert-icon": { color: "primary.main" }
        }}
      >
        Your profile data is used to personalize AI-generated content. Keep it detailed for better results.
      </Alert>

      <Box p={{ xs: 2, sm: 4 }} bgcolor="background.paper" borderRadius={4} border="1px solid" borderColor="divider" boxShadow="0 4px 20px rgba(0,0,0,0.03)">
        <Stack gap={4}>
          <Stack gap={3}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex" }}>
                <User2 size={22} />
              </Box>
              <Typography variant="h6" fontWeight={800}>
                Basic Information
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} gap={2.5}>
              <TextField
                label="Full Name"
                fullWidth
                variant="outlined"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
              <TextField
                label="Email Address"
                fullWidth
                variant="outlined"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Stack>

            <TextField
              label="Professional Summary"
              fullWidth
              multiline
              rows={5}
              variant="outlined"
              placeholder="Briefly describe your career goals and key achievements..."
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          </Stack>

          <Divider sx={{ opacity: 0.6 }} />

          <CollapsibleSection title="Contact & Social Links" defaultExpanded={true}>
            <Stack gap={3}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="WhatsApp Phone Number"
                    fullWidth
                    type="tel"
                    placeholder="+234 800 000 0000"
                    helperText="Include country code (e.g. +1...)"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    InputProps={{
                      sx: { borderRadius: 2.5 },
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: "flex", color: "success.main" }}>
                          <MessageSquare size={18} />
                        </Box>
                      ),
                    }}
                  />
                  {form.phoneNumber && (
                    <MuiLink
                      href={`https://wa.me/${form.phoneNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      sx={{ fontSize: "0.75rem", mt: 0.5, display: "block", fontWeight: 600, color: "success.main" }}
                    >
                      Preview: wa.me/{form.phoneNumber.replace(/[^0-9]/g, "")}
                    </MuiLink>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="LinkedIn URL"
                    fullWidth
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    InputProps={{
                      sx: { borderRadius: 2.5 },
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: "flex", color: "#0077b5" }}>
                          <Linkedin size={18} />
                        </Box>
                      ),
                    }}
                  />
                  {form.linkedinUrl && (
                    <MuiLink
                      href={form.linkedinUrl}
                      target="_blank"
                      sx={{ fontSize: "0.75rem", mt: 0.5, display: "flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}
                    >
                      Open LinkedIn <ExternalLink size={12} />
                    </MuiLink>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="GitHub URL"
                    fullWidth
                    type="url"
                    placeholder="https://github.com/username"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    InputProps={{
                      sx: { borderRadius: 2.5 },
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: "flex", color: "text.primary" }}>
                          <Github size={18} />
                        </Box>
                      ),
                    }}
                  />
                  {form.githubUrl && (
                    <MuiLink
                      href={form.githubUrl}
                      target="_blank"
                      sx={{ fontSize: "0.75rem", mt: 0.5, display: "flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}
                    >
                      Open GitHub <ExternalLink size={12} />
                    </MuiLink>
                  )}
                </Grid>
              </Grid>
            </Stack>
          </CollapsibleSection>

          <Divider sx={{ opacity: 0.6 }} />

          <Stack gap={2.5}>
            <CollapsibleSection
              title="Work Experience"
              count={experience.length}
              onAdd={() => expRef.current?.openNew()}
            >
              <ExperienceSection
                ref={expRef}
                experience={experience}
                onChange={setExperience}
                onSynced={async () => {
                  await refetch();
                }}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Projects & Portfolio"
              count={projects.length}
              onAdd={() => projRef.current?.openNew()}
            >
              <ProjectsSection ref={projRef} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Certificates"
              count={certificates.length}
              onAdd={() => certRef.current?.openNew()}
            >
              <CertificatesSection ref={certRef} certificates={certificates} onChange={handleCertificatesChange} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Skills & Expertise"
              count={skills.length}
              onAdd={() => skillRef.current?.openNew()}
            >
              <SkillPills ref={skillRef} skills={skills} onSynced={async () => {
                await refetch();
              }} />
            </CollapsibleSection>
          </Stack>

          <Box sx={{ display: { xs: "block", sm: "none" }, mt: 2 }}>

          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}

