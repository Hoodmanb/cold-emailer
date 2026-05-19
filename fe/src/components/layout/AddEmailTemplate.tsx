import { logger } from "@/utils/logger";
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
  UpdateEmailTemplateValidationSchema,
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
import { uploadFileToLocalStorage } from "@/utils/fileUpload";
import { cleanFormValues } from "@/utils/cleanFormValues"
import { Android12Switch } from "../ui/Switch";
import { objectToFormData } from "@/utils/objectToFormData";

type prop = {
  type: "add" | "update";
  templateId?: string;
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

export default function AddEmailTemplate({
  type,
  templateId,
  setRefresh,
}: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [mounted, setMounted] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [categoryList, setCategoryList] = useState<OutputType[]>([]);
  const [isPrivate, setPrivate] = useState(false);
  const { categories, refetchCategories } = useFetchCategory("/api/category");
  const user = useAuthStore((state) => state.userProfile?.name);

  const transformCategory = (): OutputType[] => {
    const lists = categories.map((item) => ({
      value: item._id,
      label: item.category,
    }));
    logger.debug("Nwigiri", categories);
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
          {type === "add" ? "Create email template" : " Update Recipient"}
        </Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={{
          name: "",
          subject: "",
          body: "",
          attachment: null,
          isPublic: false,
        }}
        validationSchema={
          type === "add"
            ? AddEmailTemplateValidationSchema
            : UpdateEmailTemplateValidationSchema
        }
        onSubmit={async (
          values,
          { setSubmitting, resetForm, setFieldError }
        ) => {



          const cleanedValues = cleanFormValues(values)
          const formdata = objectToFormData(cleanedValues)

          logger.debug("ATTACHMENT:", formdata);

          const logFormData = (formData: FormData) => {
            for (const [key, value] of formData.entries()) {
              logger.debug(`${key}:`, value);
            }
          };

          logFormData(formdata)

          const response =
            type === "add"
              ? await axiosInstance.post("/api/template", formdata, {
                headers: {
                  "Content-Type": "multipart/form-data",
                }
              })
              : templateId
                ? await axiosInstance.put(
                  `/api/template/${templateId}`,
                  formdata
                )
                : await axiosInstance.put(
                  `/api/template/example$$##&&%%.gmail.com`,
                  formdata
                );
          logger.debug(response.data);
          if (response.data.message === "template created successfully") {
            showSnackbar(response.data.message, "success");
            setRefresh((prev) => !prev);
            // return resetForm();
          } else if (response.data.message === "validation error") {
            const errors = response.data.errors;
            Object.keys(errors).forEach((field) => {
              setFieldError(field, errors[field]);
            });
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
                  placeholder="Enter template name"
                  value={values.name}
                  onChange={(val) => setFieldValue("name", val)}
                  onBlur={handleBlur}
                />
                <ErrorText name="name" />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Subject
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <CustomTextField
                  name="subject"
                  type="text"
                  placeholder="Enter template subject"
                  value={values.subject}
                  onChange={(val) => {
                    setFieldValue("subject", val);
                  }}
                  onBlur={handleBlur}
                />
                <ErrorText name="subject" />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Body
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                  disabled={aiGenerating}
                  onClick={async () => {
                    setAiGenerating(true);
                    try {
                      const prompt = `Create an outreach email template.\nName: ${values.name}\nCurrent subject: ${values.subject}\nCurrent body: ${values.body}\nReturn content as:\nSUBJECT: ...\nBODY: ...`;
                      const res = await axiosInstance.post("/api/settings/ai/feature-generate", {
                        featureId: "template_generation",
                        prompt,
                      });
                      console.log("API RESPONSE:", res.data);
                      if (res.data?.success) {
                        const text = String(res.data.data || "");
                        const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
                        const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
                        if (subjectMatch?.[1]) setFieldValue("subject", subjectMatch[1].trim());
                        if (bodyMatch?.[1]) setFieldValue("body", bodyMatch[1].trim());
                        showSnackbar("Template content generated", "success");
                      } else {
                        showSnackbar(res.data?.error || res.data?.message || "Failed to generate", "error");
                      }
                    } catch (err) {
                      console.error(err);
                      showSnackbar("Failed to generate", "error");
                    } finally {
                      setAiGenerating(false);
                    }
                  }}
                >
                  {aiGenerating ? "Generating..." : "Auto-generate template"}
                </Button>
                <CustomTextField
                  name="body"
                  type="text"
                  placeholder="Enter template body"
                  value={values.body}
                  onChange={(val) => {
                    setFieldValue("body", val);
                  }}
                  onBlur={handleBlur}
                  multiline
                  minRows={10}
                />
                <ErrorText name="body" />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Attachment (optional)
                </Typography>
                <CustomFileUpload
                  name="attachment"
                  placeholder="Upload your CV/Resume/Cover Letter..."
                  file={values.attachment}
                  onChange={(val) => {
                    setFieldValue("attachment", val)
                    logger.debug(val)
                  }}
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
                  text={isSubmitting ? "Creating..." : "Create Template"}
                  disabled={
                    type === "add"
                      ? Object.entries(values)
                        .filter(
                          ([key]) =>
                            key !== "attachment" &&
                            key !== "url" &&
                            key !== "isPublic"
                        )
                        .some(([, val]) =>
                          typeof val === "string" ? !val.trim() : !val
                        ) ||
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
