"use client";

import Drawer from "@/components/layout/AppBar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slideUpVariants } from "@/motion/variants";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <Drawer>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUpVariants}
            style={{ width: "100%", height: "100%" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Drawer>
    </ProtectedRoute>
  );
}

