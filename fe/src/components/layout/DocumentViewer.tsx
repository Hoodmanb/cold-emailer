// "use client";

// import React, { useState } from "react";
// import {
//   Stack,
//   Box,
//   Typography,
//   IconButton,
//   Tooltip,
//   Chip,
//   Divider,
//   TextField,
// } from "@mui/material";
// import { Copy, Download, CheckCircle, Edit3, Eye, RotateCcw } from "lucide-react";
// import DraftBadge from "./DraftBadge";
// import type { Document } from "@/types";

// interface DocumentViewerProps {
//   document: Document;
//   onApprove?: (id: string) => void;
//   onRegenerate?: () => void;
//   onContentChange?: (id: string, content: string) => void;
// }

// export default function DocumentViewer({
//   document: doc,
//   onApprove,
//   onRegenerate,
//   onContentChange,
// }: DocumentViewerProps) {
//   const [copied, setCopied] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editContent, setEditContent] = useState(doc.content);

//   const handleCopy = async () => {
//     await navigator.clipboard.writeText(doc.content);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleDownload = () => {
//     const blob = new Blob([doc.content], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = window.document.createElement("a");
//     a.href = url;
//     a.download = `${doc.type}-${doc.id.slice(0, 8)}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handleSaveEdit = () => {
//     onContentChange?.(doc.id, editContent);
//     setIsEditing(false);
//   };

//   return (
//     <Stack
//       sx={{
//         border: "1px solid",
//         borderColor: doc.status === "draft" ? "warning.main" : "divider",
//         borderRadius: "12px",
//         overflow: "hidden",
//         bgcolor: "background.paper",
//       }}
//     >
//       {/* Header */}
//       <Stack
//         direction="row"
//         justifyContent="space-between"
//         alignItems="center"
//         sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)", borderBottom: "1px solid", borderColor: "divider" }}
//       >
//         <Stack direction="row" alignItems="center" gap={1}>
//           <Typography variant="subtitle2" fontWeight={700} textTransform="capitalize">
//             {doc.type.replace("-", " ")}
//           </Typography>
//           <DraftBadge status={doc.status} />
//           {doc.editedManually && (
//             <Chip label="Manually Edited" size="small" variant="outlined" color="secondary" sx={{ fontSize: "0.65rem" }} />
//           )}
//         </Stack>
//         <Stack direction="row" gap={0.5}>
//           <Tooltip title={isEditing ? "Preview" : "Edit"}>
//             <IconButton size="small" onClick={() => setIsEditing(!isEditing)}>
//               {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
//             </IconButton>
//           </Tooltip>
//           <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
//             <IconButton size="small" onClick={handleCopy} color={copied ? "success" : "default"}>
//               <Copy size={16} />
//             </IconButton>
//           </Tooltip>
//           <Tooltip title="Download as .txt">
//             <IconButton size="small" onClick={handleDownload}>
//               <Download size={16} />
//             </IconButton>
//           </Tooltip>
//           {onRegenerate && (
//             <Tooltip title="Regenerate (creates new draft)">
//               <IconButton size="small" onClick={onRegenerate}>
//                 <RotateCcw size={16} />
//               </IconButton>
//             </Tooltip>
//           )}
//           {doc.status === "draft" && onApprove && (
//             <Tooltip title="Approve this draft">
//               <IconButton size="small" color="success" onClick={() => onApprove(doc.id)}>
//                 <CheckCircle size={16} />
//               </IconButton>
//             </Tooltip>
//           )}
//         </Stack>
//       </Stack>

//       {/* Content */}
//       <Box sx={{ p: 2, maxHeight: 400, overflowY: "auto" }}>
//         {isEditing ? (
//           <Stack gap={1}>
//             <TextField
//               multiline
//               fullWidth
//               minRows={10}
//               value={editContent}
//               onChange={(e) => setEditContent(e.target.value)}
//               inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
//             />
//             <Stack direction="row" gap={1} justifyContent="flex-end">
//               <Chip label="Cancel" onClick={() => { setIsEditing(false); setEditContent(doc.content); }} sx={{ cursor: "pointer" }} />
//               <Chip label="Save Changes" color="primary" onClick={handleSaveEdit} sx={{ cursor: "pointer" }} />
//             </Stack>
//           </Stack>
//         ) : (
//           <Typography
//             variant="body2"
//             component="pre"
//             sx={{
//               whiteSpace: "pre-wrap",
//               wordBreak: "break-word",
//               fontFamily: "monospace",
//               fontSize: "0.78rem",
//               lineHeight: 1.7,
//               color: "text.primary",
//             }}
//           >
//             {doc.content}
//           </Typography>
//         )}
//       </Box>

//       {/* Footer */}
//       <Box sx={{ px: 2, py: 1, bgcolor: "rgba(255,255,255,0.02)", borderTop: "1px solid", borderColor: "divider" }}>
//         <Typography variant="caption" color="text.secondary">
//           Model: {doc.model} Â· Created: {new Date(doc.createdAt).toLocaleDateString()}
//           {doc.approvedAt && ` Â· Approved: ${new Date(doc.approvedAt).toLocaleDateString()}`}
//         </Typography>
//       </Box>
//     </Stack>
//   );
// }





"use client";

import React, { useState } from "react";
import {
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  TextField,
} from "@mui/material";
import { Copy, Download, CheckCircle, Edit3, Eye, RotateCcw } from "lucide-react";
import DraftBadge from "./DraftBadge";
import type { Document } from "@/types";

interface DocumentViewerProps {
  document: Document;
  onApprove?: (id: string) => void;
  onRegenerate?: () => void;
  onContentChange?: (id: string, content: string) => void;
}

export default function DocumentViewer({
  document: doc,
  onApprove,
  onRegenerate,
  onContentChange,
}: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(doc.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${doc.type}-${doc.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    onContentChange?.(doc.id, editContent);
    setIsEditing(false);
  };

  return (
    <Stack
      sx={{
        border: "1px solid",
        borderColor: doc.status === "draft" ? "warning.main" : "divider",
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "rgba(255,255,255,0.02)", borderBottom: "1px solid", borderColor: "divider" }}
        gap={{ xs: 1, sm: 0 }}
      >
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={700} textTransform="capitalize">
            {doc.type.replace("-", " ")}
          </Typography>
          <DraftBadge status={doc.status} />
          {doc.editedManually && (
            <Chip label="Manually Edited" size="small" variant="outlined" color="secondary" sx={{ fontSize: "0.65rem" }} />
          )}
        </Stack>
        <Stack
          direction="row"
          gap={0.5}
          flexWrap="wrap"
          width={{ xs: "100%", sm: "auto" }}
          justifyContent={{ xs: "flex-end", sm: "flex-start" }}
        >
          <Tooltip title={isEditing ? "Preview" : "Edit"}>
            <IconButton size="small" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton size="small" onClick={handleCopy} color={copied ? "success" : "default"}>
              <Copy size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download as .txt">
            <IconButton size="small" onClick={handleDownload}>
              <Download size={16} />
            </IconButton>
          </Tooltip>
          {onRegenerate && (
            <Tooltip title="Regenerate (creates new draft)">
              <IconButton size="small" onClick={onRegenerate}>
                <RotateCcw size={16} />
              </IconButton>
            </Tooltip>
          )}
          {doc.status === "draft" && onApprove && (
            <Tooltip title="Approve this draft">
              <IconButton size="small" color="success" onClick={() => onApprove(doc.id)}>
                <CheckCircle size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Content */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, maxHeight: 400, overflowY: "auto" }}>
        {isEditing ? (
          <Stack gap={1}>
            <TextField
              multiline
              fullWidth
              minRows={10}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
            />
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Chip label="Cancel" onClick={() => { setIsEditing(false); setEditContent(doc.content); }} sx={{ cursor: "pointer" }} />
              <Chip label="Save Changes" color="primary" onClick={handleSaveEdit} sx={{ cursor: "pointer" }} />
            </Stack>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              fontSize: { xs: "0.72rem", sm: "0.78rem" },
              lineHeight: 1.7,
              color: "text.primary",
            }}
          >
            {doc.content}
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: "rgba(255,255,255,0.02)", borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary">
          Model: {doc.model} · Created: {new Date(doc.createdAt).toLocaleDateString()}
          {doc.approvedAt && ` · Approved: ${new Date(doc.approvedAt).toLocaleDateString()}`}
        </Typography>
      </Box>
    </Stack>
  );
}