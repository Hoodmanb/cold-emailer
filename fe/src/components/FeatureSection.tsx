import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid } from '@mui/material';
import { Zap, CheckCircle, Shield, TrendingUp, Layers, Rocket } from 'lucide-react';

const features = [
  { icon: <Zap size={32} />, title: 'AI Job Matching', desc: 'Find the perfect roles instantly.' },
  { icon: <CheckCircle size={32} />, title: 'Resume Optimizer', desc: 'Tailor your resume for each job.' },
  { icon: <Shield size={32} />, title: 'Privacy First', desc: 'Your data stays on your device.' },
  { icon: <TrendingUp size={32} />, title: 'ATS Scoring', desc: 'Boost your resume ranking.' },
  { icon: <Layers size={32} />, title: 'Multi‑Modal Parsing', desc: 'Extract jobs from screenshots or URLs.' },
  { icon: <Rocket size={32} />, title: 'Pipeline Tracking', desc: 'Manage applications and interviews.' },
];

export default function FeatureSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }} id="features">
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          Supercharge Your Job Search
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          All the AI‑powered tools you need to land your dream job.
        </Typography>
        <Grid container spacing={4}>
          {features.map((f, i) => (
            <Grid container sx={{ xs: 12, md: 4 }} key={i}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>{f.icon}</Box>
                  <Typography variant="h6" gutterBottom>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
