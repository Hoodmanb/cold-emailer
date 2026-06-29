import { Box, Skeleton, Stack, Grid } from "@mui/material";

// This file is automatically shown by Next.js App Router while any
// dashboard page is loading its data. No code needed in individual pages.
export default function DashboardLoading() {
  return (
    <Stack gap={4} maxWidth={1200} mx="auto" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page title */}
      <Stack gap={1}>
        <Skeleton variant="text" width={220} height={44} sx={{ borderRadius: 2 }} />
        <Skeleton variant="text" width={320} height={24} sx={{ borderRadius: 1 }} />
      </Stack>

      {/* Metric cards row */}
      <Grid container spacing={3}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2, flexShrink: 0 }} />
              <Stack gap={0.5} flex={1}>
                <Skeleton variant="text" width="50%" height={32} />
                <Skeleton variant="text" width="80%" height={20} />
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Main content area */}
      <Grid container spacing={4}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack gap={4}>
            {/* Card 1 */}
            <Box
              sx={{
                p: 4,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Skeleton variant="text" width={180} height={28} sx={{ mb: 3 }} />
              <Stack direction="row" justifyContent="space-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Stack key={i} alignItems="center" gap={1}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" width={60} height={18} />
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Card 2 — Activity feed */}
            <Box
              sx={{
                p: 4,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Skeleton variant="text" width={160} height={28} sx={{ mb: 3 }} />
              <Stack gap={3}>
                {[0, 1, 2, 3].map((i) => (
                  <Stack key={i} direction="row" gap={2} alignItems="center">
                    <Skeleton variant="circular" width={10} height={10} sx={{ flexShrink: 0 }} />
                    <Stack flex={1} gap={0.5}>
                      <Skeleton variant="text" width="70%" height={20} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack gap={4}>
            {[0, 1].map((i) => (
              <Box
                key={i}
                sx={{
                  p: 4,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Skeleton variant="text" width={140} height={28} sx={{ mb: 3 }} />
                <Stack gap={2}>
                  {[0, 1, 2].map((j) => (
                    <Stack key={j} direction="row" justifyContent="space-between" alignItems="center">
                      <Skeleton variant="text" width="50%" height={20} />
                      <Skeleton variant="rounded" width={64} height={24} sx={{ borderRadius: 6 }} />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
