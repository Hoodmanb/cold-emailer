import { Box, Skeleton, Stack } from "@mui/material";

// Generic loading state for all dashboard sub-pages
// Next.js shows this automatically during data fetching
export default function SubPageLoading() {
  return (
    <Stack gap={3} sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack gap={0.5}>
          <Skeleton variant="text" width={200} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width={300} height={22} sx={{ borderRadius: 1 }} />
        </Stack>
        <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
      </Stack>

      {/* Filter / tab bar */}
      <Stack direction="row" gap={1}>
        {[80, 100, 70, 90].map((w, i) => (
          <Skeleton key={i} variant="rounded" width={w} height={32} sx={{ borderRadius: 6 }} />
        ))}
      </Stack>

      {/* Content cards */}
      <Stack gap={2}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              p: 2.5,
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack gap={0.75} flex={1}>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="25%" height={18} />
                <Stack direction="row" gap={1} mt={0.5}>
                  <Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: 6 }} />
                  <Skeleton variant="rounded" width={72} height={20} sx={{ borderRadius: 6 }} />
                </Stack>
              </Stack>
              <Skeleton variant="circular" width={64} height={64} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
