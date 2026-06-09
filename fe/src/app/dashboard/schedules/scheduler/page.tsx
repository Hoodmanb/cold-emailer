"use client";

import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography, Button } from "@mui/material";
import { PlusIcon, Calendar } from "lucide-react";
import { useGlobalModal } from "@/components/ui/Modal.jsx";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";
import { useGetSchedule } from "@/hooks/queryHooks";
import CreateSchedule from "@/components/layout/CreateSchedule";
import SchedulesList from "@/components/layout/ScheduleList";

export default function SchedulerPage() {
  const { showModal } = useGlobalModal();
  const user = useAuthStore((state) => state.userProfile?.name);
  const [mounted, setMounted] = useState(false);
  const { schedule, loading, error, refetch } = useGetSchedule();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) void refetch();
  }, [refresh, user, refetch]);

  if (!mounted || loading) return <Box>Loading schedules...</Box>;
  if (error) return <Box>Error loading schedules</Box>;

  const schedules = Array.isArray(schedule) ? schedule : [];

  return (
    <Stack>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <CustomButton
          text="Create Schedule"
          icon={PlusIcon}
          iconColor="grey"
          onClick={() => showModal(<CreateSchedule type="add" setRefresh={setRefresh} />)}
        />
      </Stack>

      {schedules.length > 0 ? (
        <SchedulesList schedules={schedules} setRefresh={setRefresh} />
      ) : (
        <Stack sx={{ flexDirection: "column", alignItems: "center", p: "70px 0", border: "1px solid #0F172A1A", borderRadius: "20px" }}>
          <Calendar size="3em" color="grey" />
          <Typography mt="10px" variant="h6" fontWeight={600}>No schedules yet</Typography>
          <Typography width="65%" textAlign="center" mt="10px" mb="15px" variant="subtitle2" color="grey">
            Create your first email schedule to automate your campaigns
          </Typography>
          <Button
            variant="contained"
            onClick={() => showModal(<CreateSchedule type="add" setRefresh={setRefresh} />)}
            startIcon={<PlusIcon size={18} />}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2 }}
          >
            Create Schedule
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
