"use client"
import React, { useState } from "react";
import { Box, Container, AppBar, Toolbar, Typography, Stack, Grid, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import useAuthStore from "@/store/useAuthStore";
import FeedbackFormModal from "@/components/feedback/FeedbackFormModal";

import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import FeatureSection from "@/components/FeatureSection";
import HowItWorks from "@/components/HowItWorks";
import BenefitsSection from "@/components/BenefitsSection";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => !!s.token);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["public-communication-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/communication/public");
      return res.data?.data || {};
    },
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
          <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M0 0h24v24H0z" /></svg> CareerBot
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button color="inherit" sx={{ display: { xs: "none", sm: "block" }, textTransform: "none" }}>Features</Button>
            <Button color="inherit" sx={{ display: { xs: "none", sm: "block" }, textTransform: "none" }}>How it Works</Button>
            <Button color="inherit" sx={{ display: { xs: "none", sm: "block" }, textTransform: "none" }} onClick={() => router.push("/pricing")}>Pricing</Button>
            <Button variant="contained" color="primary" onClick={() => router.push("/dashboard")} sx={{ borderRadius: 2, textTransform: "none" }}>Dashboard</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer */}

      <HeroSection />
      <ProblemSection />
      <FeatureSection />
      <HowItWorks />
      <BenefitsSection />
      <SocialProof />
      <FAQ />
      <FinalCTA />

      {/* Contact & Support Section */}
      <Box sx={{ py: { xs: 8, md: 10 }, borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(99, 102, 241, 0.01)" }} id="contact">
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}>
            Support &amp; Feedback
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: "600px", mx: "auto" }}>
            Reach out through our customer support channels or send us direct platform feedback.
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {supportEmail && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M0 0h24v24H0z" /></svg>
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Email Support</Typography>
                  <Button variant="outlined" component="a" href={`mailto:${supportEmail}`} sx={{ borderRadius: 2, textTransform: "none" }}>Email Us</Button>
                </Box>
              </Grid>
            )}
            {whatsappUrl && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "#22c55e", mb: 2, display: "flex", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M0 0h24v24H0z" /></svg>
                  </Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>WhatsApp Chat</Typography>
                  <Button variant="outlined" component="a" href={whatsappUrl} target="_blank" sx={{ borderRadius: 2, textTransform: "none", color: "#22c55e", borderColor: "#22c55e" }}>Chat Now</Button>
                </Box>
              </Grid>
            )}
            {instagramUrl && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 4, bgcolor: "background.paper" }}>
                  <Box sx={{ color: "#ec4899", mb: 2, display: "flex", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M0 0h24v24H0z" /></svg>
                  </Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>Instagram</Typography>
                  <Button variant="outlined" component="a" href={instagramUrl} target="_blank" sx={{ borderRadius: 2, textTransform: "none", color: "#ec4899", borderColor: "#ec4899" }}>Follow Us</Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} CareerBot. All rights reserved.</Typography>
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
