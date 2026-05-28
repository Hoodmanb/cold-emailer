"use client";

import React from "react";
import {
  Box, Container, Typography, Grid, Paper, Stack, Button, Chip, CircularProgress, Alert,
} from "@mui/material";
import { Check, Key, Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import { useBillingConfig, useCheckoutGateway, useCheckoutCredits, formatMoney } from "@/hooks/queryHooks/billing";
import useAuthStore from "@/store/useAuthStore";

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: config, isLoading, error } = useBillingConfig();
  const checkoutGateway = useCheckoutGateway();
  const checkoutCredits = useCheckoutCredits();

  const handleGatewayCheckout = async () => {
    if (!isAuthenticated) {
      window.location.href = "/signup";
      return;
    }
    const result = await checkoutGateway.mutateAsync();
    if (result.authorizationUrl) window.location.href = result.authorizationUrl;
  };

  const handleCreditCheckout = async (packId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/signup";
      return;
    }
    const result = await checkoutCredits.mutateAsync(packId);
    if (result.authorizationUrl) window.location.href = result.authorizationUrl;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: 8 }}>
      <Container maxWidth="lg">
        <Stack spacing={2} alignItems="center" textAlign="center" mb={6}>
          <Chip label="Simple, transparent pricing" color="primary" variant="outlined" />
          <Typography variant="h3" fontWeight={900}>Choose how you want to use Job Bot</Typography>
          <Typography color="text.secondary" maxWidth={640}>
            Bring your own API key with a Gateway plan, or use our AI with pay-as-you-go credits.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button component={Link} href="/" variant="text">Home</Button>
            {isAuthenticated ? (
              <Button component={Link} href="/dashboard/billing" variant="outlined">My Billing</Button>
            ) : (
              <Button component={Link} href="/login" variant="contained">Sign In</Button>
            )}
          </Stack>
        </Stack>

        {isLoading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
        {error && <Alert severity="error">Failed to load pricing. Please try again later.</Alert>}

        {config && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 4, height: "100%", border: "2px solid", borderColor: "primary.main", borderRadius: 4 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Key size={20} />
                    <Typography variant="h5" fontWeight={800}>Gateway Plan</Typography>
                    <Chip label="BYO API Key" size="small" color="primary" />
                  </Stack>
                  <Typography variant="h3" fontWeight={900}>
                    {formatMoney(config.gateway.price, config.gateway.currency)}
                  </Typography>
                  <Typography color="text.secondary">
                    {config.gateway.durationMonths} months of full access using your own AI provider keys.
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      "All features unlocked",
                      "Use your OpenAI, Claude, Gemini, or OpenRouter keys",
                      "No credit deductions",
                      "Document generation & workflows",
                    ].map((item) => (
                      <Stack key={item} direction="row" spacing={1} alignItems="center">
                        <Check size={16} color="#16a34a" />
                        <Typography variant="body2">{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!config.gateway.active || checkoutGateway.isPending}
                    onClick={handleGatewayCheckout}
                  >
                    {config.gateway.active ? "Get Gateway Access" : "Unavailable"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Coins size={20} />
                  <Typography variant="h5" fontWeight={800}>Credit Packs</Typography>
                  <Chip label="System AI" size="small" />
                </Stack>
                <Typography color="text.secondary">
                  Credits expire after 6 months. No API key required — we handle AI for you.
                </Typography>
                <Grid container spacing={2}>
                  {config.creditPacks.map((pack) => (
                    <Grid key={pack.id} size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 3, height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        <Stack spacing={1.5} height="100%">
                          <Typography fontWeight={800}>{pack.name}</Typography>
                          <Typography variant="h4" fontWeight={900}>{pack.amount}</Typography>
                          <Typography variant="caption" color="text.secondary">credits</Typography>
                          <Typography fontWeight={700}>{formatMoney(pack.price, pack.currency)}</Typography>
                          <Box flex={1} />
                          <Button
                            variant="outlined"
                            fullWidth
                            disabled={checkoutCredits.isPending}
                            onClick={() => handleCreditCheckout(pack.id)}
                          >
                            Buy Credits
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        )}

        <Paper
          elevation={0}
          sx={{
            mt: 6,
            p: 4,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Sparkles size={18} />
            <Typography variant="h6" fontWeight={800}>
              Credit usage guide
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Credit usage is calculated dynamically based on AI model usage, request
            complexity, and processing time.
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Simple requests use fewer credits, while heavier AI tasks consume more
            depending on computation required.
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={2}
          >
            ⚙️ Usage is not fixed per feature and may vary per request.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
