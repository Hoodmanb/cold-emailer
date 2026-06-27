import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();
  return (
    <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 }, textAlign: 'center', bgcolor: 'background.paper', backgroundImage: 'linear-gradient(to bottom, rgba(99,102,241,0.05), transparent)' }}>
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-0.02em' }}>
          Land More Interviews with <Box component="span" sx={{ color: 'primary.main' }}>AI‑Powered Job Bot</Box>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
          Upload your resume once, let Job Bot find, tailor, and apply to the perfect roles for you – all in seconds.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => router.push('/signup')} sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem', textTransform: 'none' }}>
            Get Started Free
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.push('/pricing')} sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem', textTransform: 'none' }}>
            Pricing
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
