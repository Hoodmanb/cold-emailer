import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function FinalCTA() {
  const router = useRouter();
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', textAlign: 'center' }} id="final-cta">
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
          Ready to Land More Interviews?
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Start your AI‑powered job search for free today.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button variant="contained" size="large" onClick={() => router.push('/signup')} sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none' }}>
            Get Started Free
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.push('/pricing')} sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none' }}>
            See Pricing
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
