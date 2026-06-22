// components/documentBuilder/TemplateRenderer.tsx
"use client";

import React from "react";
import { Box } from "@mui/material";

export type TemplateLayout = {
    type: "single-column" | "two-column";
    blocks?: string[];
    columns?: { width: string; blocks: string[] }[];
};

export type TemplateBlock = {
    type: string;
    title?: string;
};

export type TemplateStyle = {
  fontFamily?: string;
  primaryColor?: string;
  fontSize?: number | string;
  spacing?: number | string;
};

export type PreviewData = {
    profile?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        summary?: string;
    };
    experience?: Array<{
        company?: string;
        role?: string;
        period?: string;
        description?: string;
    }>;
    education?: Array<{
        institution?: string;
        degree?: string;
        period?: string;
    }>;
    skills?: string[];
    projects?: Array<{
        name?: string;
        description?: string;
    }>;
    certificates?: Array<{
        name?: string;
        issuer?: string;
        date?: string;
    }>;
};

type Props = {
    name: string;
    layout: TemplateLayout;
    style: TemplateStyle;
    blocks: Record<string, TemplateBlock>;
    data?: PreviewData;
};

// Default preview data so the template never looks empty
const DEFAULT_DATA: PreviewData = {
    profile: {
        name: "Alex Johnson",
        email: "alex@example.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        summary: "Experienced software engineer with a passion for building scalable web applications and leading cross-functional teams.",
    },
    experience: [
        { company: "TechCorp", role: "Senior Engineer", period: "2021 - Present", description: "Led development of microservices architecture serving 2M+ users." },
        { company: "StartupXYZ", role: "Full Stack Developer", period: "2018 - 2021", description: "Built and launched 3 customer-facing products from scratch." },
    ],
    education: [
        { institution: "Stanford University", degree: "M.S. Computer Science", period: "2016 - 2018" },
        { institution: "UC Berkeley", degree: "B.S. Computer Science", period: "2012 - 2016" },
    ],
    skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "PostgreSQL", "GraphQL", "Docker"],
    projects: [
        { name: "OpenSource Dashboard", description: "A real-time analytics dashboard with 10k+ GitHub stars." },
        { name: "E-commerce Platform", description: "Full-stack platform processing $2M+ in annual transactions." },
    ],
    certificates: [
        { name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2023" },
        { name: "Google Cloud Professional", issuer: "Google", date: "2022" },
    ],
};

function renderBlock(blockId: string, block: TemplateBlock, data: PreviewData, style: TemplateStyle): string {
    const { primaryColor = "#111111", fontSize: rawFontSize = 12, spacing: rawSpacing = 12 } = style;
    const fontSize = typeof rawFontSize === "string" ? Number(rawFontSize) : rawFontSize;
    const spacing = typeof rawSpacing === "string" ? Number(rawSpacing) : rawSpacing;
    const title = block.title || blockId.charAt(0).toUpperCase() + blockId.slice(1);


    const sectionStyle = `margin-bottom:${spacing}px;`;
    const headingStyle = `color:${primaryColor};font-size:${fontSize + 2}px;font-weight:700;margin-bottom:${spacing / 2}px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid ${primaryColor};padding-bottom:4px;`;
    const textStyle = `font-size:${fontSize}px;line-height:1.6;color:#333;`;

    switch (blockId) {
        case "profile": {
            const p = data.profile || DEFAULT_DATA.profile;
            return `
        <div style="${sectionStyle}">
          <h1 style="font-size:${fontSize + 8}px;font-weight:800;color:${primaryColor};margin:0 0 ${spacing / 2}px 0;">${p?.name || "Your Name"}</h1>
          <div style="${textStyle}color:#666;margin-bottom:${spacing}px;">
            ${[p?.email, p?.phone, p?.location].filter(Boolean).join(" · ")}
          </div>
          <p style="${textStyle}">${p?.summary || ""}</p>
        </div>
      `;
        }

        case "experience": {
            const items = data.experience || DEFAULT_DATA.experience || [];
            return `
        <div style="${sectionStyle}">
          <div style="${headingStyle}">${title}</div>
          ${items.map(exp => `
            <div style="margin-bottom:${spacing}px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <strong style="font-size:${fontSize + 1}px;">${exp?.role || ""}</strong>
                <span style="font-size:${fontSize - 1}px;color:#666;">${exp?.period || ""}</span>
              </div>
              <div style="font-size:${fontSize}px;color:${primaryColor};font-weight:600;">${exp?.company || ""}</div>
              <p style="${textStyle}margin-top:4px;">${exp?.description || ""}</p>
            </div>
          `).join("")}
        </div>
      `;
        }

        case "education": {
            const items = data.education || DEFAULT_DATA.education || [];
            return `
        <div style="${sectionStyle}">
          <div style="${headingStyle}">${title}</div>
          ${items.map(edu => `
            <div style="margin-bottom:${spacing}px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <strong style="font-size:${fontSize + 1}px;">${edu?.degree || ""}</strong>
                <span style="font-size:${fontSize - 1}px;color:#666;">${edu?.period || ""}</span>
              </div>
              <div style="font-size:${fontSize}px;color:#666;">${edu?.institution || ""}</div>
            </div>
          `).join("")}
        </div>
      `;
        }

        case "skills": {
            const items = data.skills || DEFAULT_DATA.skills || [];
            return `
        <div style="${sectionStyle}">
          <div style="${headingStyle}">${title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${items.map(skill => `
              <span style="background:${primaryColor}15;color:${primaryColor};padding:3px 10px;border-radius:4px;font-size:${fontSize}px;font-weight:500;">${skill}</span>
            `).join("")}
          </div>
        </div>
      `;
        }

        case "projects": {
            const items = data.projects || DEFAULT_DATA.projects || [];
            return `
        <div style="${sectionStyle}">
          <div style="${headingStyle}">${title}</div>
          ${items.map(proj => `
            <div style="margin-bottom:${spacing}px;">
              <strong style="font-size:${fontSize + 1}px;color:${primaryColor};">${proj?.name || ""}</strong>
              <p style="${textStyle}margin-top:4px;">${proj?.description || ""}</p>
            </div>
          `).join("")}
        </div>
      `;
        }

        case "certificates": {
            const items = data.certificates || DEFAULT_DATA.certificates || [];
            return `
        <div style="${sectionStyle}">
          <div style="${headingStyle}">${title}</div>
          ${items.map(cert => `
            <div style="margin-bottom:${spacing / 2}px;">
              <div style="font-size:${fontSize}px;font-weight:600;">${cert?.name || ""}</div>
              <div style="font-size:${fontSize - 1}px;color:#666;">${cert?.issuer || ""} · ${cert?.date || ""}</div>
            </div>
          `).join("")}
        </div>
      `;
        }

        default:
            return `<div style="${sectionStyle}"><div style="${headingStyle}">${title}</div><p style="${textStyle}">Block content</p></div>`;
    }
}

function generateDocumentHTML(name: string, layout: TemplateLayout, style: TemplateStyle, blocks: Record<string, TemplateBlock>, data: PreviewData): string {
    const { fontFamily = 'Inter, "Segoe UI", sans-serif', primaryColor = "#111111", fontSize: rawFontSize = 12 } = style;
    const fontSize = typeof rawFontSize === "string" ? Number(rawFontSize) : rawFontSize;

    const pageStyle = `
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 210mm;
    margin: 0 auto;
    padding: 40px;
    background: white;
    min-height: 297mm;
    box-sizing: border-box;
  `;

    const getBlockHTML = (blockId: string) => {
        const block = blocks[blockId];
        if (!block) return "";
        return renderBlock(blockId, block, data, style);
    };

    if (layout.type === "single-column") {
        const blockIds = layout.blocks || [];
        const content = blockIds.map(getBlockHTML).join("");
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body><div style="${pageStyle}">${content}</div></body></html>`;
    }

    // Two-column layout
    const columns = layout.columns || [
        { width: "30%", blocks: [] },
        { width: "70%", blocks: [] },
    ];

    const colHTML = columns.map((col) => {
        const content = (col.blocks || []).map(getBlockHTML).join("");
        return `<div style="width:${col.width};padding-right:20px;">${content}</div>`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body><div style="${pageStyle}display:flex;gap:0;">${colHTML}</div></body></html>`;
}

export default function TemplateRenderer({ name, layout, style, blocks, data }: Props) {
    const mergedData = { ...DEFAULT_DATA, ...data };

    const html = React.useMemo(() => {
        return generateDocumentHTML(name, layout, style, blocks, mergedData);
    }, [name, layout, style, blocks, mergedData]);

    return (
        <Box
            component="iframe"
            srcDoc={html}
            title={name}
            sx={{
                border: "none",
                width: "100%",
                minHeight: 480,
                background: "white",
                borderRadius: 1,
            }}
        />
    );
}