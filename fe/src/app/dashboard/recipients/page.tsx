"use client";
import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography, Badge, IconButton } from "@mui/material";
import { EllipsisVertical, PlusIcon, User2 } from "lucide-react";
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
import { useGetRecipients, useFetchCategory } from "@/hooks/queryHooks";

const Recipients = () => {
  const { showModal } = useGlobalModal();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  const { recipient, loading, error, refetch } = useGetRecipients();
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
      {recipient && recipient?.length > 0 && (
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
              text="Add recipient"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(<AddRecipient type={"add"} setRefresh={setRefresh} />)
              }
            />
          </Box>
          <Box>
            <CustomButton
              text="Add Category"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(<AddCategory type={"add"} setRefresh={setRefresh} />)
              }
            />
          </Box>
        </Stack>
      )}
      {recipient && recipient?.length > 0 ? (
        <RecipientList recipient={recipient} setRefresh={setRefresh} />
      ) : (
        <Stack
          sx={{
            flexDirection: "column",
            alignItems: "center",
            p: "70px 0px",
            border: "1px solid #0F172A1A",
            borderRadius: "20px",
          }}
        >
          <User2 size="3em" color="grey" />
          <Typography mt="10px" variant="h6" fontWeight={600}>
            No recipients yet
          </Typography>
          <Typography
            width={"65%"}
            textAlign="center"
            mt="10px"
            mb="15px"
            variant="subtitle2"
            color="grey"
          >
            Start by adding your first recipient to begin your email campaigns
          </Typography>
          <Box sx={{ width: "auto" }}>
            <CustomButton
              text="Add Your First Recipient"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(<AddRecipient type={"add"} setRefresh={setRefresh} />)
              }
            />
          </Box>
        </Stack>
      )}

      {categories && categories?.length > 0 ? (
        <Stack
          sx={{
            flexDirection: "column",
            alignItems: "start",
            p: "30px",
            border: "1px solid #0F172A1A",
            borderRadius: "20px",
            mt: "20px",
          }}
        >
          <Typography variant="h6" fontWeight={600} mb="15px">
            Categories
          </Typography>
          <Stack direction={"row"} gap={1} flexWrap={"wrap"}>
            {categories?.map((categor) => (
              <Box key={categor._id}>
                <CustomBadge
                  text={categor.category}
                  icon={
                    <CustomDropdownMenu
                      menuTrigger={
                        <IconButton sx={{ p: "2px" }}>
                          <EllipsisVertical size={"18px"} />
                        </IconButton>
                      }
                      menuItems={[
                        {
                          label: "Update",
                          onClick: () =>
                            showModal(
                              <AddCategory
                                type={"update"}
                                categoryId={categor._id}
                                setRefresh={setRefresh}
                              />
                            ),
                        },
                        {
                          label: "Delete",
                          onClick: () => deleteCategory(categor._id),
                        },
                      ]}
                    />
                  }
                />
              </Box>
            ))}
          </Stack>
        </Stack>
      ) : (
        <Stack
          sx={{
            flexDirection: "column",
            alignItems: "center",
            p: "40px 0px",
            border: "1px solid #0F172A1A",
            borderRadius: "20px",
            mt: "20px",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Category
          </Typography>
          <Typography
            textAlign="center"
            mt="10px"
            mb="15px"
            variant="subtitle2"
            color="grey"
          >
            No categories created yet
          </Typography>
          <Box sx={{ width: "auto" }}>
            <CustomButton
              text="Create Your First Category"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(<AddCategory type={"add"} setRefresh={setRefresh} />)
              }
            />
          </Box>
        </Stack>
      )}
    </Stack>
  );
};

export default Recipients;
