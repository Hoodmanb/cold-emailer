"use client";
import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography, Badge, IconButton } from "@mui/material";
import { EllipsisVertical, PlusIcon, User2, Calendar } from "lucide-react";
import { useGlobalModal } from "@/components/ui/Modal.jsx";
import AddRecipient from "@/components/layout/AddRecipient";
import AddCategory from "@/components/layout/AddCategory";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";
import CustomBadge from "@/components/ui/Badge";
import RecipientList from "@/components/layout/Recipients";
import CustomDropdownMenu from "@/components/ui/Menu";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  useGetRecipients,
  useFetchCategory,
  useGetSchedule,
} from "@/hooks/queryHooks";
import CreateSchedule from "@/components/layout/CreateSchedule";
import SchedulesList from "@/components/layout/ScheduleList";

const Recipients = () => {
  const { showModal } = useGlobalModal();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  const { schedule, loading, error, refetch } = useGetSchedule();
  const { categories, loadingFetch, refetchCategories } =
    useFetchCategory("/api/category");

  const [refresh, setRefresh] = useState(false);
  const { showSnackbar } = useSnackbar();

  const deleteCategory = async (id: string) => {
    try {
      const deleted = await axiosInstance.delete(`/api/category/${id}`);
      const res = deleted.data;
      if (deleted.status === 204) {
        showSnackbar("category deleted successfully.", "success");
        return setRefresh((prev) => !prev);
      } else {
        showSnackbar(res.message || "error deleting category", "error");
      }
    } catch (error) {
      showSnackbar("error deleting category", "error");
    }
  };

  useEffect(() => {
    (async () => {
      if (user) {
        await refetch();
        await refetchCategories();
      }
    })();
    setMounted(true);
  }, [refresh]);

  if (!mounted) return;
  if (loading) return <Box>Loading</Box>;
  if (error) return <Box>Error occured</Box>;

  return (
    <Stack>
      {schedule && schedule?.length > 0 && (
        <Stack
          sx={{
            mb: "20px",
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Box>
            <CustomButton
              text="Create Schedule"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(
                  <CreateSchedule type={"add"} setRefresh={setRefresh} />
                )
              }
            />
          </Box>
        </Stack>
      )}
      {!schedule ? // && schedule?.length > 0 ?
        (

          <SchedulesList />
        ) : (
          <Stack>
            <Stack
              sx={{
                flexDirection: "column",
                alignItems: "center",
                p: "70px 0px",
                border: "1px solid #0F172A1A",
                borderRadius: "20px",
              }}
            >
              <Calendar size="3em" color="grey" />
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
                Create your first email schedule to automate your campaigns
              </Typography>
              <Box sx={{ width: "auto" }}>
                <CustomButton
                  text="Create Schedule"
                  icon={PlusIcon}
                  iconColor="grey"
                  onClick={() =>
                    showModal(
                      <CreateSchedule type={"add"} setRefresh={setRefresh} />
                    )
                  }
                />
              </Box>
            </Stack>
          </Stack>
        )}
    </Stack>
  );
};

export default Recipients;
