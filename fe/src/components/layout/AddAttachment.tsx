import {
  Stack,
  Box,
  Button,
  Typography,
  IconButton,
  FormControlLabel,
} from "@mui/material";
import { useGlobalModal } from "../ui/Modal";
import CustomTextField from "@/components/ui/TextField";
import {
  AddEmailTemplateValidationSchema,
  CreateCVValidationSchema,
} from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { Form, Formik } from "formik";
import { useSnackbar } from "@/context/SnackbarContext";
import SelectOption from "../ui/Option";
import { File, XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import { useFetchCategory } from "@/hooks/queryHooks";
import CustomFileUpload from "../ui/FileUploadInput";
import useAuthStore from "@/store/useAuthStore";
import { uploadFileToFirebase } from "@/utils/fileUpload";
import { Android12Switch } from "../ui/Switch";

type prop = {
  type: "add" | "update";
  recipientEmail?: string;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

type InputType = {
  _id: string;
  category: string;
};

type OutputType = {
  label: string;
  value: string;
};

export default function AddAttachment({
  type,
  recipientEmail,
  setRefresh,
}: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [mounted, setMounted] = useState(false);
  const [categoryList, setCategoryList] = useState<OutputType[]>([]);
  const [isPrivate, setPrivate] = useState(false);
  const { categories, refetchCategories } = useFetchCategory("/api/attachment");
  const user = useAuthStore((state) => state.user);

  const transformCategory = (): OutputType[] => {
    const lists = categories.map((item) => ({
      value: item._id,
      label: item.category,
    }));
    console.log("Nwigiri", categories);
    return lists;
  };

  useEffect(() => {
    setCategoryList(transformCategory());
    setMounted(true);
  }, [categories]);

  if (!mounted) return;

  return (
    <Stack
      sx={{
        backgroundColor: "white",
        borderRadius: "20px",
        p: "25px",
        width: "80%",
        minWidth: "250px",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        mb={2}
      >
        <Typography fontWeight={"bold"}>
          {type === "add" ? "Upload A CV template" : " Update Recipient"}
        </Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={{
          name: "",
          attachment: null,
          url: "",
          isPublic: false,
        }}
        validationSchema={
          type === "add"
            ? CreateCVValidationSchema
            : AddEmailTemplateValidationSchema
        }
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          // if (values.attachment) {
          //   const uploadAttachmentUrl = await uploadFileToFirebase(
          //     values.attachment
          //   );
          //   if (uploadAttachmentUrl.success) {
          //     values.url = uploadAttachmentUrl.url || "";
          //     console.log("Uploaded File URL:", uploadAttachmentUrl.url);
          //   } else {
          //     console.log("Upload Failed:", uploadAttachmentUrl.message);
          //     showSnackbar(uploadAttachmentUrl.message, "error");
          //   }
          // }

          values.url = "uploadAttachmentUrl.url.pdf";
          const response =
            type === "add"
              ? await axiosInstance.post("/api/attachment", values)
              : recipientEmail
              ? await axiosInstance.put(
                  `/api/recipient/${recipientEmail}`,
                  values
                )
              : await axiosInstance.put(
                  `/api/recipient/example$$##&&%%.gmail.com`,
                  values
                );
          console.log(response.data);
          if (response.data.message === "attachment created successfully") {
            showSnackbar(response.data.message, "success");
            setRefresh((prev) => !prev);
            return resetForm();
          } else if (response.data.message === "recipient not found") {
            showSnackbar("recipient not found", "info");
          } else if (response.data.message === "recipient already exist") {
            showSnackbar("recipient already exist", "info");
          } else if (
            response.data.message === "recipient updated successfully"
          ) {
            showSnackbar("recipient already exist", "info");
            setRefresh((prev) => !prev);
            return resetForm();
          } else {
            showSnackbar(response.data.message, "error");
          }
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form>
            <Stack gap={1}>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Name
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <CustomTextField
                  name="name"
                  type="text"
                  placeholder="Enter CV name"
                  value={values.name}
                  onChange={(val) => setFieldValue("name", val)}
                  onBlur={handleBlur}
                />
                <ErrorText name="name" />
              </Box>

              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Attachment
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <CustomFileUpload
                  placeholder="Upload your CV/Resume/Cover Letter..."
                  file={values.attachment}
                  onChange={(val) => setFieldValue("attachment", val)}
                  icon={File}
                  iconColor="gray"
                />
                <ErrorText name="attachment" />
              </Box>
              <Box mb="10px">
                <FormControlLabel
                  control={
                    <Android12Switch
                      checked={values.isPublic}
                      onChange={(val) => {
                        setFieldValue("isPublic", val.target.checked);
                      }}
                    />
                  }
                  sx={{
                    ".MuiFormControlLabel-label": {
                      fontSize: "12px",
                      fontWeight: "600",
                    },
                  }}
                  label="choose to make this template public"
                />
                <Typography fontSize={"0.8em"}>
                  Note: Your template will be reviewed to decide whether it can
                  be public.
                </Typography>
              </Box>

              <Box
                sx={{
                  width: "40%",
                  minWidth: "150px",
                  alignSelf: "end",
                }}
              >
                <CustomButton
                  text={isSubmitting ? "Uploading..." : "Upload"}
                  disabled={
                    type === "add"
                      ? !values.name.trim() ||
                        !values.attachment ||
                        values.isPublic === null ||
                        Object.keys(errors).length > 0 ||
                        isSubmitting
                      : isSubmitting
                  }
                />
              </Box>
            </Stack>
          </Form>
        )}
      </Formik>
    </Stack>
  );
}
