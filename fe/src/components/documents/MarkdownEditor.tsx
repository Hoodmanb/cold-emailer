"use client";

import React, { useRef, useCallback } from "react";
import {
  Box, Stack, ToggleButton, ToggleButtonGroup, Typography, Divider,
  Tooltip, IconButton, Paper,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import {
  Bold, Italic, Heading1, Heading2, List, Link, Minus,
  Eye, Edit3, Columns,
} from "lucide-react";

type ViewMode = "edit" | "preview" | "split";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix?: string;
  suffix?: string;
  linePrefix?: string;
  insertText?: string;
}

const TOOLBAR: ToolbarAction[] = [
  { icon: <Bold size={14} />, label: "Bold", prefix: "**", suffix: "**" },
  { icon: <Italic size={14} />, label: "Italic", prefix: "_", suffix: "_" },
  { icon: <Heading1 size={14} />, label: "Heading 1", linePrefix: "# " },
  { icon: <Heading2 size={14} />, label: "Heading 2", linePrefix: "## " },
  { icon: <List size={14} />, label: "Bullet", linePrefix: "- " },
  { icon: <Minus size={14} />, label: "Divider", insertText: "\n---\n" },
  { icon: <Link size={14} />, label: "Link", prefix: "[", suffix: "](url)" },
];

export default function MarkdownEditor({ value, onChange, minRows = 18 }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback((action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let next = value;
    let newCursorStart = start;
    let newCursorEnd = end;

    if (action.insertText) {
      next = value.slice(0, start) + action.insertText + value.slice(end);
      newCursorStart = newCursorEnd = start + action.insertText.length;
    } else if (action.linePrefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart);
      const alreadyPrefixed = currentLine.startsWith(action.linePrefix);
      const insert = alreadyPrefixed ? "" : action.linePrefix;
      next = value.slice(0, lineStart) + (alreadyPrefixed ? currentLine.slice(action.linePrefix.length) : action.linePrefix + currentLine);
      newCursorStart = start + (alreadyPrefixed ? -action.linePrefix.length : insert.length);
      newCursorEnd = end + (alreadyPrefixed ? -action.linePrefix.length : insert.length);
    } else if (action.prefix && action.suffix) {
      next = value.slice(0, start) + action.prefix + selected + action.suffix + value.slice(end);
      newCursorStart = start + action.prefix.length;
      newCursorEnd = end + action.prefix.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursorStart, newCursorEnd);
    });
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + "  " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(start + 2, start + 2));
    }
  };

  const showEdit = viewMode === "edit" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";
  const textAreaMinHeight = `${minRows * 1.6}em`;

  return (
    <Stack gap={0}>
      {/* Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          px: 1.5, py: 0.75, borderRadius: "12px 12px 0 0", borderBottom: "none",
          display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap",
          bgcolor: "action.hover",
        }}
      >
        <Stack direction="row" gap={0.25}>
          {TOOLBAR.map((action) => (
            <Tooltip key={action.label} title={action.label} placement="top">
              <IconButton size="small" onClick={() => applyFormat(action)} sx={{ p: 0.5, borderRadius: 1.5 }}>
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="edit" sx={{ py: 0.4, px: 1, gap: 0.5, fontSize: "0.7rem" }}>
            <Edit3 size={12} /> Edit
          </ToggleButton>
          <ToggleButton value="split" sx={{ py: 0.4, px: 1, gap: 0.5, fontSize: "0.7rem" }}>
            <Columns size={12} /> Split
          </ToggleButton>
          <ToggleButton value="preview" sx={{ py: 0.4, px: 1, gap: 0.5, fontSize: "0.7rem" }}>
            <Eye size={12} /> Preview
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ ml: "auto" }}>
          <Typography variant="caption" color="text.disabled">
            {value.length.toLocaleString()} chars
          </Typography>
        </Box>
      </Paper>

      {/* Editor / Preview panes */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: "0 0 12px 12px", overflow: "hidden", display: "flex" }}
      >
        {showEdit && (
          <Box sx={{ flex: 1, minWidth: 0, borderRight: showPreview ? "1px solid" : "none", borderColor: "divider" }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: textAreaMinHeight,
                padding: "16px",
                border: "none",
                outline: "none",
                resize: "vertical",
                fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                backgroundColor: "transparent",
                color: "inherit",
                boxSizing: "border-box",
              }}
              placeholder="Edit document content (Markdown)..."
            />
          </Box>
        )}

        {showPreview && (
          <Box
            sx={{
              flex: 1, minWidth: 0, p: 2.5, overflowY: "auto",
              maxHeight: `calc(${textAreaMinHeight} + 2em)`,
              "& h1": { fontSize: "1.5rem", fontWeight: 800, mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "divider" },
              "& h2": { fontSize: "1.15rem", fontWeight: 700, mt: 2, mb: 1 },
              "& h3": { fontSize: "1rem", fontWeight: 700, mt: 1.5, mb: 0.75 },
              "& p": { mb: 1, lineHeight: 1.7 },
              "& ul, & ol": { pl: 3, mb: 1 },
              "& li": { mb: 0.4 },
              "& hr": { my: 2, opacity: 0.3 },
              "& strong": { fontWeight: 700 },
              "& em": { fontStyle: "italic" },
              "& a": { color: "primary.main" },
              "& code": { fontFamily: "monospace", bgcolor: "action.hover", px: 0.5, borderRadius: 0.5, fontSize: "0.85em" },
              "& pre": { bgcolor: "action.hover", p: 2, borderRadius: 2, overflowX: "auto", mb: 1 },
              "& blockquote": { borderLeft: "3px solid", borderColor: "primary.main", pl: 2, ml: 0, color: "text.secondary", fontStyle: "italic" },
            }}
          >
            {value.trim() ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <Typography color="text.disabled" variant="body2" sx={{ fontStyle: "italic" }}>
                Preview will appear here...
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
