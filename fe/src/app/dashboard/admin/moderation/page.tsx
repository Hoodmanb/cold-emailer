"use client";

import React from "react";
import PendingApprovalQueue from "@/components/template/PendingApprovalQueue";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminModerationPage() {
  return (
    <>
      <AdminPageHeader
        helpId="admin.moderation"
        title="Template Moderation"
        description="Approve or reject user‑submitted templates."
      />
      <PendingApprovalQueue />
    </>
  );
}
