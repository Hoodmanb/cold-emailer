import React from "react";
import { Box, Container, Grid, Card, CardContent, Typography } from "@mui/material";
import { CheckCircle, Clock, TrendingUp, ShieldCheck } from "lucide-react";

const benefits = [
  {
    icon: <CheckCircle size={32} />, // Save Time
    title: "Save Hours",
    description: "Automate resume tailoring and outreach, freeing you from repetitive tasks.",
  },
  {
    icon: <TrendingUp size={32} />, // More Interviews
    title: "Higher Interview Rate",
    description: "AI‑matched jobs boost response rates up to 30%.",
  },
  {
    icon: <Clock size={32} />, // Faster Process
    title: "Fast Applications",
    description: "One‑click apply and track, completing a cycle in minutes.",
  },
  {
    icon: <ShieldCheck size={32} />, // Data‑Driven
    title: "Data‑Driven Insights",
    description: "Real‑time analytics show which keywords land interviews.",
  },
];

export default function BenefitsSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper" }} id="benefits">
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
          Why Job Bot?
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {benefits.map((item, idx) => (
            <Grid container sx={{ xs: 12, sm: 6, md: 5 }} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
