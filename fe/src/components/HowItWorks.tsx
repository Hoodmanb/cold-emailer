import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Button, Stack } from '@mui/material';
import { Zap, CheckCircle, Shield } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    { step: '1', title: 'Upload Resume', desc: 'Provide your master resume and profile.' },
    { step: '2', title: 'AI Matches Jobs', desc: 'Job Bot finds and scores ideal positions.' },
    { step: '3', title: 'Apply Instantly', desc: 'Generate tailored resumes & cover letters, then send.' },
    { step: '4', title: 'Track Progress', desc: 'Monitor applications and interview status.' },
  ];
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }} id="how-it-works">
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          How It Works
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Four simple steps to land more interviews.
        </Typography>
        <Grid container spacing={4}>
          {steps.map((s) => (
            <Grid container sx={{ xs: 12, md: 3 }} key={s.step}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {s.step}
                  </Box>
                  <Typography variant="h6" gutterBottom>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
