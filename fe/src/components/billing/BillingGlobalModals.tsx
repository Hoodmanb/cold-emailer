"use client";

import { useInsufficientCreditsHandler } from "@/components/billing/InsufficientCreditsModal";

export default function BillingGlobalModals() {
  const { modalProps, Modal } = useInsufficientCreditsHandler();
  return <Modal {...modalProps} />;
}
