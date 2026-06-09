"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  AppBar,
  Toolbar,
  Grid
} from "@mui/material";
import { CheckCircle, Zap, Shield, TrendingUp, Layers, Rocket, Mail, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import useAuthStore from "@/store/useAuthStore";
import FeedbackFormModal from "@/components/feedback/FeedbackFormModal";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => !!s.token);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["public-communication-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/communication/public");
      return res.data?.data || {};
    }
  });

  const supportEmail = config?.supportEmail?.email;
  const whatsappUrl = config?.whatsapp?.url;
  const instagramUrl = config?.instagram?.url;
  const twitterUrl = config?.twitter?.url;

  return (
    <Box sx={{ minHeight: "100vh", color: "text.primary" }}>
      {/* Navigation */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rocket size={24} /> CareerBot
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button color="inherit" sx={{ display: { xs: 'none', sm: 'block' }, textTransform: 'none' }}>Features</Button>
            <Button color="inherit" sx={{ display: { xs: 'none', sm: 'block' }, textTransform: 'none' }}>How it Works</Button>
            <Button color="inherit" sx={{ display: { xs: 'none', sm: 'block' }, textTransform: 'none' }} onClick={() => router.push('/pricing')}>Pricing</Button>
            <Button variant="contained" color="primary" onClick={() => router.push('/dashboard')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Dashboard
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar /> {/* Spacer */}

      {/* Hero Section */}
      <Box sx={{ pt: { xs: 8, md: 15 }, pb: { xs: 8, md: 10 }, px: 2, textAlign: "center", bgcolor: "background.paper", backgroundImage: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.05), transparent)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: "2.5rem", md: "4rem" }, letterSpacing: "-0.02em" }}>
            Automate Your <Box component="span" sx={{ color: "primary.main" }}>Career Growth</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400, maxWidth: "600px", mx: "auto" }}>
            The ultimate local-first AI platform to tailor resumes, generate cover letters, and send perfectly timed outreach emails.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => router.push('/dashboard')} sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: "1.1rem", textTransform: "none" }}>
              Get Started
            </Button>
            <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: "1.1rem", textTransform: "none" }}>
              Learn More
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }} id="features">
        <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
          Supercharge Your Job Search
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 8 }}>
          Everything you need to land your dream job, powered by intelligent automation.
        </Typography>

        <Grid container spacing={4}>
          {[
            { icon: <Zap size={32} />, title: "Instant AI Resumes", desc: "Instantly tailor your resume to match specific job descriptions and beat the ATS." },
            { icon: <CheckCircle size={32} />, title: "Automated Outreach", desc: "Draft and schedule highly personalized cold emails to recruiters and hiring managers." },
            { icon: <Shield size={32} />, title: "Local-First Privacy", desc: "Your career data stays on your machine. Fully private, secure, and under your control." },
            { icon: <TrendingUp size={32} />, title: "ATS Scoring", desc: "Get real-time feedback on missing keywords to ensure your profile ranks at the top." },
            { icon: <Layers size={32} />, title: "Multi-modal Parsing", desc: "Upload a screenshot of a job posting and our AI will extract all requirements instantly." },
            { icon: <Rocket size={32} />, title: "Pipeline Tracking", desc: "Manage applications, track interviews, and never miss a follow-up opportunity." }
          ].map((feature, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Card sx={{ height: "100%", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ color: "primary.main", mb: 2, bgcolor: "action.hover", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it Works */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 8, md: 12 }, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
            How It Works
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 8 }}>
            Three simple steps to automate your applications.
          </Typography>
          <Grid container spacing={4}>
            {[
              { step: "1", title: "Build Your Profile", desc: "Input your master resume, skills, and career history once." },
              { step: "2", title: "Import Jobs", desc: "Add jobs via text, URL, or screenshot. We extract what matters." },
              { step: "3", title: "Generate & Apply", desc: "Get a custom resume and cover letter in 10 seconds. Send and track." }
            ].map((item, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i} sx={{ textAlign: "center" }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", mx: "auto", mb: 2 }}>
                  {item.step}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
          Ready to take the next step?
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Join thousands of professionals securing interviews on autopilot.
        </Typography>
        <Button variant="contained" size="large" onClick={() => router.push('/dashboard')} sx={{ px: 6, py: 2, borderRadius: 2, fontSize: "1.2rem", textTransform: "none" }}>
          Try Now - It's Free
        </Button>
      </Container>

      {/* Contact & Support Section */}
      <Box sx={{ py: { xs: 8, md: 10 }, borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(99, 102, 241, 0.01)" }} id="contact">
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}>
            Support & Feedback
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: "600px", mx: "auto" }}>
            Reach out through our customer support channels or send us direct platform feedback.
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {supportEmail && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                    <Mail size={36} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Email Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                    Send us an email and we'll get back to you as soon as possible.
                  </Typography>
                  <Button variant="outlined" component="a" href={`mailto:${supportEmail}`} sx={{ borderRadius: 2, textTransform: "none" }}>
                    Email Us
                  </Button>
                </Card>
              </Grid>
            )}

            {whatsappUrl && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "#22c55e", mb: 2, display: "flex", justifyContent: "center" }}>
                    <WhatsAppIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    WhatsApp Chat
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                    Connect instantly with our support team on WhatsApp.
                  </Typography>
                  <Button variant="outlined" component="a" href={whatsappUrl} target="_blank" sx={{ borderRadius: 2, textTransform: "none", color: "#22c55e", borderColor: "#22c55e", "&:hover": { borderColor: "#16a34a", bgcolor: "rgba(34, 197, 94, 0.04)" } }}>
                    Chat Now
                  </Button>
                </Card>
              </Grid>
            )}

            {instagramUrl && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "#ec4899", mb: 2, display: "flex", justifyContent: "center" }}>
                    <InstagramIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Instagram
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                    Follow our updates and message us on Instagram.
                  </Typography>
                  <Button variant="outlined" component="a" href={instagramUrl} target="_blank" sx={{ borderRadius: 2, textTransform: "none", color: "#ec4899", borderColor: "#ec4899", "&:hover": { borderColor: "#db2777", bgcolor: "rgba(236, 72, 153, 0.04)" } }}>
                    Follow Us
                  </Button>
                </Card>
              </Grid>
            )}

            {twitterUrl && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "#171717", mb: 2, display: "flex", justifyContent: "center" }}>
                    <XIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    X (Twitter)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                    Send a direct message or tweet at us on X.
                  </Typography>
                  <Button variant="outlined" component="a" href={twitterUrl} target="_blank" sx={{ borderRadius: 2, textTransform: "none", color: "#171717", borderColor: "#171717", "&:hover": { borderColor: "#000", bgcolor: "rgba(0,0,0,0.04)" } }}>
                    Message Us
                  </Button>
                </Card>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "rgba(99, 102, 241, 0.03)" }}>
                <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                  <MessageSquare size={36} />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Platform Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                  Report bugs, request features, or share general comments.
                </Typography>
                {isAuthenticated ? (
                  <Button variant="contained" onClick={() => setFeedbackModalOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>
                    Send Feedback
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={() => router.push("/login")} sx={{ borderRadius: 2, textTransform: "none" }}>
                    Login to Feedback
                  </Button>
                )}
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} CareerBot. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>Privacy</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>Terms</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>Contact</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <FeedbackFormModal open={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </Box>
  );
}
