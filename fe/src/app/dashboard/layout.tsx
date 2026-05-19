"use client";

import Drawer from "@/components/layout/AppBar";
import React from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Drawer>{children}</Drawer>;
}
