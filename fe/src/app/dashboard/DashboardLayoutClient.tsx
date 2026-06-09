"use client";

import React from 'react';

import Drawer from "@/components/layout/AppBar";
import FloatingProductivityWidget from "@/components/productivity/FloatingProductivityWidget";
import ProductivityModals from "@/components/productivity/ProductivityModals";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Drawer>{children}</Drawer>
      <FloatingProductivityWidget />
      <ProductivityModals />
      <FeedbackWidget />
    </>
  );
}
