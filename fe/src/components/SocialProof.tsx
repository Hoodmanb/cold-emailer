import React from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Grid } from '@mui/material';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "Job Bot landed me 5 interviews in a week – the AI does the heavy lifting.",
    name: 'Alex P.',
    role: 'Software Engineer',
  },
  {
    quote: "I saved hours every day. The resume tweaks are spot on.",
    name: 'Maria K.',
    role: 'Product Manager',
  },
  {
    quote: "The data insights helped me understand what recruiters look for.",
    name: 'Samuel L.',
    role: 'Data Analyst',
  },
];

export default function SocialProof() {
  return (
    <Box sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }} id="social-proof">
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
          What Our Users Say
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {testimonials.map((t, i) => (
            <Grid key={i} container sx={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3, bgcolor: 'background.paper' }}>
                <CardContent>
                  <Quote size={24} color="primary" style={{ opacity: 0.3 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                    “{t.quote}”
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <Avatar>{t.name.charAt(0)}</Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
