"use client";

import Drawer from "@/components/layout/AppBar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <Drawer>{children}</Drawer>
    </ProtectedRoute>
  );
}
