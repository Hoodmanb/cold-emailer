"use client";

import React, { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthProvider";

export default function SignupPage() {
  const { signup, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await signup({ name, email, password });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h5" fontWeight={700}>Create Account</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button variant="contained" onClick={() => void onSubmit()} disabled={loading || submitting || !name || !email || !password}>
              {submitting ? "Creating..." : "Signup"}
            </Button>
            <Box>
              <Typography variant="body2">
                Have an account? <a href="/login">Login</a>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
