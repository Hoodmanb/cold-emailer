"use client";

import React from "react";
import { useAuth } from "@/context/AuthProvider";
import AuthInitializingScreen from "@/components/auth/AuthInitializingScreen";

/**
 * Lightweight guard for nested dashboard layouts.
 * AuthProvider is the single source of truth; this only blocks render while auth initializes.
 */
export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <AuthInitializingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthInitializingScreen label="Redirecting..." />;
  }

  return children;
}
