"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  useDocumentTemplate,
  useGetSystemTemplate,
} from "@/features/templates/hooks";
import type {
  BuilderMode,
  DocumentTemplate,
  DocumentTemplateType,
  TemplateBlock,
  TemplateLayout,
  TemplateStyle,
} from "@/features/templates/types/template.types";
import {
  buildDefaultBlocks,
  buildDefaultLayout,
} from "@/features/templates/types/template.types";

const DEFAULT_STYLE: TemplateStyle = {
  fontFamily: 'Inter, "Segoe UI", sans-serif',
  primaryColor: "#111111",
  fontSize: 12,
  spacing: 12,
};

export interface BuilderState {
  mode: BuilderMode;
  templateId: string | null;
  source: "system" | "user";
  loading: boolean;
  error: string | null;
  baseTemplate: DocumentTemplate | null;
  isEditMode: boolean;
  isForkMode: boolean;
  isCreateMode: boolean;
}

export function useTemplateBuilderMode(): BuilderState {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") as BuilderMode | null;
  const templateId = searchParams.get("templateId");
  const sourceParam = searchParams.get("source");

  const mode: BuilderMode =
    modeParam === "edit" || modeParam === "fork" || modeParam === "create"
      ? modeParam
      : templateId
        ? "fork"
        : "create";

  const source: "system" | "user" =
    sourceParam === "user" || mode === "edit" ? "user" : "system";

  const loadUserTemplate = mode === "edit" || (mode === "fork" && source === "user");
  const loadSystemTemplate =
    mode === "fork" && source === "system" && Boolean(templateId);

  const {
    data: userTemplate,
    isLoading: userLoading,
    error: userError,
  } = useDocumentTemplate(loadUserTemplate ? templateId : null);

  const {
    template: systemTemplate,
    loading: systemLoading,
    error: systemError,
  } = useGetSystemTemplate(loadSystemTemplate ? templateId : null);

  return useMemo(() => {
    const isCreateMode = mode === "create";
    const isEditMode = mode === "edit";
    const isForkMode = mode === "fork";

    if (isCreateMode) {
      return {
        mode,
        templateId: null,
        source: "user" as const,
        loading: false,
        error: null,
        baseTemplate: {
          id: "",
          name: "My Custom Template",
          type: "resume" as DocumentTemplateType,
          layout: buildDefaultLayout(),
          blocks: buildDefaultBlocks(),
          style: DEFAULT_STYLE,
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isEditMode,
        isForkMode,
        isCreateMode,
      };
    }

    const loading = loadUserTemplate ? userLoading : systemLoading;
    const errorMsg =
      (loadUserTemplate && userError instanceof Error ? userError.message : null) ||
      (loadSystemTemplate && systemError ? systemError : null);

    let baseTemplate: DocumentTemplate | null = null;

    if (loadUserTemplate && userTemplate) {
      baseTemplate = userTemplate;
    } else if (loadSystemTemplate && systemTemplate) {
      baseTemplate = {
        id: systemTemplate.id,
        name: systemTemplate.name,
        type: (systemTemplate.category || "resume") as DocumentTemplateType,
        layout: systemTemplate.layout || buildDefaultLayout(),
        blocks: systemTemplate.blocks || buildDefaultBlocks(),
        style: systemTemplate.style || DEFAULT_STYLE,
        category: systemTemplate.category,
        isAdminTemplate: true,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      mode,
      templateId,
      source,
      loading,
      error: !loading && !baseTemplate ? errorMsg || "Template not found" : errorMsg,
      baseTemplate,
      isEditMode,
      isForkMode,
      isCreateMode,
    };
  }, [
    mode,
    templateId,
    source,
    loadUserTemplate,
    loadSystemTemplate,
    userLoading,
    systemLoading,
    userError,
    systemError,
    userTemplate,
    systemTemplate,
  ]);
}

export type { TemplateLayout, TemplateBlock, TemplateStyle };
