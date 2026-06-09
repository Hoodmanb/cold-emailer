"use client";

import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { PlusIcon } from "lucide-react";
import ScheduleCard from "./ScheduleCard";
import CustomButton from "../ui/Button";
import CreateSchedule from "./CreateSchedule";
import { useGlobalModal } from "../ui/Modal";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import type { Schedule } from "@/types";

type Props = {
  schedules: Schedule[];
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const SchedulesList: React.FC<Props> = ({ schedules, setRefresh }) => {
  const { showModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await axiosInstance.delete(`/api/scheduler/${id}`);
      showSnackbar("Schedule deleted", "success");
      setRefresh((p) => !p);
    } catch {
      showSnackbar("Failed to delete schedule", "error");
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography color="text.secondary">Manage your automated email campaigns</Typography>
        <CustomButton
          text="Create Schedule"
          icon={PlusIcon}
          iconColor="grey"
          onClick={() => showModal(<CreateSchedule type="add" setRefresh={setRefresh} />)}
        />
      </Stack>

      <Stack spacing={3}>
        {schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={{
              id: schedule.id,
              name: schedule.name,
              template:
                typeof schedule.template === "object" && schedule.template
                  ? schedule.template.subject || "Email template"
                  : "Email template",
              recipients: Array.isArray(schedule.recipients) ? schedule.recipients.length : 0,
              frequency: schedule.frequency,
              status: schedule.disabled ? "paused" : "active",
            }}
            onEdit={() => showModal(<CreateSchedule type="update" scheduleID={schedule.id} setRefresh={setRefresh} />)}
            onDelete={handleDelete}
            onToggleStatus={() => showSnackbar("Pause/resume will be available in a future update", "info")}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default SchedulesList;
