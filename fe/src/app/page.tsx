"use client";

import React, { useEffect } from "react";
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
import { CheckCircle, Zap, Shield, TrendingUp, Layers, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  // useEffect(() => {
  //   router.replace("/login");
  // }, [router]);

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
    </Box>
  );
}
