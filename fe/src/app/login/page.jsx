"use client";

import React, { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h5" fontWeight={700}>Login</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button variant="contained" onClick={() => void onSubmit()} disabled={loading || submitting || !email || !password}>
              {submitting ? "Signing in..." : "Login"}
            </Button>
            <Box>
              <Typography variant="body2">
                No account? <a href="/signup">Create one</a>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
