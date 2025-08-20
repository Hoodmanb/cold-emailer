"use client";

import { useEffect, ReactNode } from "react";
import { initAuthListener } from "@/store/useAuthStore";

interface Props {
  children: ReactNode;
}

const AuthProvider = ({ children }: Props) => {
  useEffect(() => {
    initAuthListener();
  }, []);

  return children;
};

export default AuthProvider;
