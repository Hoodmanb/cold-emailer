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
 *   Supports both JSON-wrapped HTML ({ data: { html: "..." } }) and direct HTML responses.
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
        const responseData = String(response.data || "");

        // Handle direct HTML response (system templates endpoint returns HTML directly)
        if (contentType.includes("text/html") && responseData.trimStart().startsWith("<!DOCTYPE")) {
          if (!cancelled) {
            setHtml(responseData);
            setLoading(false);
          }
          return;
        }

        // Handle app shell fallback (indicates routing issue)
        if (contentType.includes("text/html") && responseData.trimStart().startsWith("<!doctype html>") && responseData.includes("<div id=\"root\">")) {
          throw new Error("Preview URL returned the app shell instead of template HTML");
        }

        // Handle JSON-wrapped HTML response (document-templates endpoint)
        if (contentType.includes("application/json")) {
          try {
            const jsonData = JSON.parse(responseData);
            const htmlContent = jsonData?.data?.html || jsonData?.html || "";
            if (htmlContent) {
              if (!cancelled) {
                setHtml(htmlContent);
                setLoading(false);
              }
              return;
            }
            throw new Error("No HTML content found in response");
          } catch {
            throw new Error("Failed to parse JSON response");
          }
        }

        // Unexpected response
        throw new Error(`Unexpected content type: ${contentType}`);
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
