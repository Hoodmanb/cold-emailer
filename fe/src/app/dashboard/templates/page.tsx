"use client";
import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography, Badge, IconButton } from "@mui/material";
import { EllipsisVertical, File, Mail, PlusIcon, User2 } from "lucide-react";
import { useGlobalModal } from "@/components/ui/Modal.jsx";
import AddRecipient from "@/components/layout/AddRecipient";
import AddCategory from "@/components/layout/AddCategory";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";
import CustomBadge from "@/components/ui/Badge";
import CustomDropdownMenu from "@/components/ui/Menu";
import { useSnackbar } from "@/context/SnackbarContext";
import { useFetchAttachment } from "@/hooks/queryHooks";
import { useGetTemplates } from "@/hooks/queryHooks/templates";
import AddEmailTemplate from "@/components/layout/AddEmailTemplate";
import AddAttachment from "@/components/layout/AddAttachment";
import TemplateList from "@/components/layout/EmailTemplate";
import AttachmentList from "@/components/layout/Attachment";

const Recipients = () => {
  const { showModal } = useGlobalModal();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  const { template, loading, error, refetch } = useGetTemplates();
  const { attachment, loadingFetch, refetchAttachment } =
    useFetchAttachment("/api/attachment");

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
        await refetchAttachment();
      }
    })();
    setMounted(true);
  }, [refresh]);

  if (!mounted) return;
  if (loading) return <Box>Loading</Box>;
  if (error) return <Box>Error occured</Box>;

  return (
    <Stack>
      {/* {(Array.isArray(template) && template.length > 0) ||
        (Array.isArray(attachment) && attachment.length > 0 && (
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
            {attachment?.length > 0 && (
              <Box>
                <CustomButton
                  text="Add A CV Template"
                  icon={PlusIcon}
                  iconColor="grey"
                  onClick={() =>
                    showModal(
                      <AddAttachment type={"add"} setRefresh={setRefresh} />
                    )
                  }
                />
              </Box>
            )}
            {template?.length > 0 && (
              <Box>
                <CustomButton
                  text="Create Email Template"
                  icon={PlusIcon}
                  iconColor="grey"
                  onClick={() =>
                    showModal(
                      <AddEmailTemplate type={"add"} setRefresh={setRefresh} />
                    )
                  }
                />
              </Box>
            )}
          </Stack>
        ))} */}

      {(Array.isArray(template) && template.length > 0) ||
      (Array.isArray(attachment) && attachment.length > 0) ? (
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
          {Array.isArray(attachment) && attachment.length > 0 && (
            <Box>
              <CustomButton
                text="Add A CV Template"
                icon={PlusIcon}
                iconColor="grey"
                onClick={() =>
                  showModal(
                    <AddAttachment type={"add"} setRefresh={setRefresh} />
                  )
                }
              />
            </Box>
          )}
          {Array.isArray(template) && template.length > 0 && (
            <Box>
              <CustomButton
                text="Create Email Template"
                icon={PlusIcon}
                iconColor="grey"
                onClick={() =>
                  showModal(
                    <AddEmailTemplate type={"add"} setRefresh={setRefresh} />
                  )
                }
              />
            </Box>
          )}
        </Stack>
      ) : null}

      {template && template?.length > 0 ? (
        <TemplateList templates={template} setRefresh={setRefresh} />
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
          <Mail size="3em" color="grey" />
          <Typography mt="10px" variant="h6" fontWeight={600}>
            No Email templates yet
          </Typography>
          <Typography
            width={"65%"}
            textAlign="center"
            mt="10px"
            mb="15px"
            variant="subtitle2"
            color="grey"
          >
            Create your first email template to start your campaigns
          </Typography>
          <Box sx={{ width: "auto" }}>
            <CustomButton
              text="Create Your First Template"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(
                  <AddEmailTemplate type={"add"} setRefresh={setRefresh} />
                )
              }
            />
          </Box>
        </Stack>
      )}

      {attachment && attachment.length > 0 ? (
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
            Attachments
          </Typography>
          <Stack direction={"row"} gap={1} flexWrap={"wrap"}>
            <AttachmentList attachments={attachment} setRefresh={setRefresh} />
          </Stack>
        </Stack>
      ) : (
        <Stack
          sx={{
            flexDirection: "column",
            alignItems: "center",
            p: "70px 0px",
            border: "1px solid #0F172A1A",
            borderRadius: "20px",
            mt: "20px",
          }}
        >
          <File size="3em" color="grey" />
          <Typography mt="10px" variant="h6" fontWeight={600}>
            No attachment yet
          </Typography>
          <Typography
            width={"65%"}
            textAlign="center"
            mt="10px"
            mb="15px"
            variant="subtitle2"
            color="grey"
          >
            Upload a CV/Resume
          </Typography>
          <Box sx={{ width: "auto" }}>
            <CustomButton
              text="Upload Your First Attachment"
              icon={PlusIcon}
              iconColor="grey"
              onClick={() =>
                showModal(
                  <AddAttachment type={"add"} setRefresh={setRefresh} />
                )
              }
            />
          </Box>
        </Stack>
      )}
    </Stack>
  );
};

export default Recipients;
