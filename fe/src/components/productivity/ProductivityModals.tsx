"use client";

import React from "react";
import dynamic from "next/dynamic";

// Each modal is only downloaded when first opened, not upfront.
// DocumentGeneratorModal alone is 43KB — this keeps it out of the main bundle.
const AIAssistantModal = dynamic(() => import("./AIAssistantModal"), {
  ssr: false,
});

const SendMailModal = dynamic(() => import("./SendMailModal"), {
  ssr: false,
});

const DocumentGeneratorModal = dynamic(() => import("./DocumentGeneratorModal"), {
  ssr: false,
});

export default function ProductivityModals() {
  return (
    <>
      <AIAssistantModal />
      <SendMailModal />
      <DocumentGeneratorModal />
    </>
  );
}
