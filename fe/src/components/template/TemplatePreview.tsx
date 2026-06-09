"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { isImageAssetPath, resolveBackendAssetUrl } from "@/lib/assetUrls";

type Props = {
  url: string;
  title?: string;
};

/**
 * Renders template previews from the backend.
 * - Image previews (webp/png) use an <img> tag via the proxied asset URL.
 * - HTML previews are fetched with auth and rendered in an iframe via srcDoc.
 */
export default function TemplatePreview({ url, title }: Props) {
  const resolvedUrl = resolveBackendAssetUrl(url);
  const isImage = isImageAssetPath(resolvedUrl);

  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(!isImage);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) return;

    let cancelled = false;
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(resolvedUrl, {
          responseType: "text",
          transformResponse: [(data) => data],
          headers: { "X-Bypass-Global-Toast": "true" },
        });
        const contentType = String(response.headers?.["content-type"] || "");
        if (contentType.includes("text/html") && String(response.data).trimStart().startsWith("<!DOCTYPE")) {
          throw new Error("Preview URL returned the app shell instead of template HTML");
        }
        if (!cancelled) {
          setHtml(String(response.data || ""));
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load preview";
          setError(message);
          setLoading(false);
        }
      }
    };

    void fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, isImage]);

  if (isImage) {
    return (
      <Box sx={{ width: "100%", minHeight: 300, bgcolor: "#f1f5f9", display: "flex", justifyContent: "center", p: 2 }}>
        <Box
          component="img"
          src={resolvedUrl}
          alt={title ?? "Template preview"}
          sx={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain", borderRadius: 2, boxShadow: 1 }}
        />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ width: "100%", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f1f5f9" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: "100%", minHeight: 300, bgcolor: "#f1f5f9", p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: 300, bgcolor: "#f1f5f9" }}>
      <Box
        component="iframe"
        srcDoc={html}
        title={title ?? "Template preview"}
        sx={{ border: "none", width: "100%", minHeight: 480 }}
      />
    </Box>
  );
}
