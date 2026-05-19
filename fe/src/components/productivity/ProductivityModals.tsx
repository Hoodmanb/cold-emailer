"use client";

import React from "react";
import AIAssistantModal from "./AIAssistantModal";
import SendMailModal from "./SendMailModal";
import DocumentGeneratorModal from "./DocumentGeneratorModal";

import { useProductivity } from "@/context/ProductivityContext";

export default function ProductivityModals() {
  return (
    <>
      <AIAssistantModal />
      <SendMailModal />
      <DocumentGeneratorModal />
    </>
  );
}
