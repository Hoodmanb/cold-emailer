import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography } from "@mui/material";
import { Calendar, HistoryIcon, PlusIcon } from "lucide-react";
import ScheduleHistory from "@/components/layout/ScheduleHistory";


const History = () => {
  const schedule = true
  return (
    <Stack>
      {schedule ? <ScheduleHistory />
        : (
          <Stack
            sx={{
              flexDirection: "column",
              alignItems: "center",
              p: "50px 0px",
              border: "1px solid #0F172A1A",
              borderRadius: "20px",
            }}
          >
            <HistoryIcon size="3em" color="grey" />
            <Typography mt="10px" variant="h6" fontWeight={600}>
              No schedules yet
            </Typography>
            <Typography
              width={"65%"}
              textAlign="center"
              mt="10px"
              mb="15px"
              variant="subtitle2"
              color="grey"
            >
              You have no schedule history, create a schedule to see activities on
              this page
            </Typography>
          </Stack>
        )}
    </Stack>
  );
};

export default History;
