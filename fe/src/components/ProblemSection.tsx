import React from 'react';
import { Box, Container, Typography, Stack, Button, Grid, Card, CardContent } from '@mui/material';
import { Zap, CheckCircle, Shield } from 'lucide-react';

export default function ProblemSection() {
  const pains = [
    { icon: <Zap size={32} />, title: 'Hundreds of applications', description: 'Submitting endless applications with no response.' },
    { icon: <CheckCircle size={32} />, title: 'Resume rejections', description: 'Your resume gets filtered out by ATS.' },
    { icon: <Shield size={32} />, title: 'No interview replies', description: 'Never hearing back from recruiters.' },
  ];
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }} id="problem">
      <Container maxWidth="md">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700 }}>
          The Job Hunt is Broken
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Job seekers waste time on repetitive tasks and miss opportunities.
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {pains.map((p, i) => (
            <Grid container sx={{ xs: 12, sm: 4 }} key={i}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>{p.icon}</Box>
                  <Typography variant="h6" gutterBottom>{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
