import React from "react";
import { Box, Typography, Button, Grid, Paper, Stack } from "@mui/material";
import { Columns, Layout } from "lucide-react";

interface LayoutEditorProps {
  layout: any;
  onChange: (layout: any) => void;
}

export default function LayoutEditor({ layout = { type: "single-column" }, onChange }: LayoutEditorProps) {
  const setType = (type: "single-column" | "two-column") => {
    if (type === "single-column") {
      onChange({
        type: "single-column",
        blocks: layout.blocks || ["profile", "experience", "education", "skills", "projects", "certificates"]
      });
    } else {
      onChange({
        type: "two-column",
        columns: [
          { width: "30%", blocks: ["profile", "skills", "certificates"] },
          { width: "70%", blocks: ["experience", "projects", "education"] }
        ]
      });
    }
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 3, borderRadius: 4, background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(20px)", borderColor: "divider", mb: 3,
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 12px 30px rgba(0,0,0,0.03)" }
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
        <Layout size={20} color="#3b82f6" />
        <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em">Layout Structure</Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Choose the structure of your CV document.
      </Typography>

      <Grid container spacing={2}>
        {/* FIX: Use size prop for MUI Grid v2, or item xs={6} for v1 */}
        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant={layout.type === "single-column" ? "contained" : "outlined"}
            onClick={() => setType("single-column")}
            sx={{ height: 90, borderRadius: 3, display: "flex", flexDirection: "column", gap: 1, textTransform: "none", borderWidth: 2, "&:hover": { borderWidth: 2 } }}
          >
            <Columns size={20} />
            <Typography variant="subtitle2" fontWeight={700}>Single Column</Typography>
          </Button>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant={layout.type === "two-column" ? "contained" : "outlined"}
            onClick={() => setType("two-column")}
            sx={{ height: 90, borderRadius: 3, display: "flex", flexDirection: "column", gap: 1, textTransform: "none", borderWidth: 2, "&:hover": { borderWidth: 2 } }}
          >
            <Stack direction="row" gap={0.5}>
              <Columns size={16} />
              <Columns size={16} />
            </Stack>
            <Typography variant="subtitle2" fontWeight={700}>Two Columns</Typography>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}