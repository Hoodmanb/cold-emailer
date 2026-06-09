"use client";

import React from "react";
import { Box } from "@mui/material";
import ModelCatalogManager from "@/components/admin/models/ModelCatalogManager";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AdminModelsPage() {
  return (
    <Box maxWidth={1100}>
      <AdminPageHeader
        helpId="page.models"
        title="AI Models"
        description="Manage the app-wide provider/model catalog used by AI features and billing markup"
      />
      <ModelCatalogManager />
    </Box>
  );
}
