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
import { Paperclip, XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import { useFetchCategory } from "@/hooks/queryHooks";
import { Android12Switch } from "../ui/Switch";
import AttachmentPicker, {
  AttachmentPreviewList,
  type AttachmentRecord,
} from "@/components/attachments/AttachmentPicker";

type prop = {
  type: "add" | "update";
  templateId?: string;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftParentId] = useState(
    () => templateId || `email-template-draft-${Date.now()}`,
  );
  const { categories } = useFetchCategory("/api/category");

  useEffect(() => {
    setMounted(true);
    if (templateId) {
      axiosInstance
        .get("/api/attachment", { params: { parentId: templateId, parentType: "email_template" } })
        .then((res) => setAttachments(res.data?.data || []))
        .catch(() => undefined);
    }
  }, [categories, templateId]);

  if (!mounted) return null;

  return (
    <>
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight="bold">
            {type === "add" ? "Create email template" : "Update email template"}
          </Typography>
          <IconButton onClick={closeModal}><XIcon /></IconButton>
        </Stack>

        <Formik
          initialValues={{ name: "", subject: "", body: "", isPublic: false }}
          validationSchema={
            type === "add" ? AddEmailTemplateValidationSchema : UpdateEmailTemplateValidationSchema
          }
          onSubmit={async (values, { setSubmitting, resetForm, setFieldError }) => {
            const payload = {
              ...values,
              attachmentRecords: attachments.map((a) => ({
                sourceDocumentId: a.sourceDocumentId,
                title: a.title,
                type: a.type,
                format: a.format,
                fileUrl: a.fileUrl,
                source: a.source,
                customName: a.customName,
              })),
            };

            try {
              const response =
                type === "add"
                  ? await axiosInstance.post("/api/template", payload)
                  : templateId
                    ? await axiosInstance.put(`/api/template/${templateId}`, payload)
                    : await axiosInstance.put("/api/template/invalid", payload);

              if (
                response.data.message === "template created successfully" ||
                response.data.message === "Template updated successfully"
              ) {
                showSnackbar(response.data.message, "success");
                setRefresh((prev) => !prev);
                closeModal();
                return resetForm();
              }
              if (response.data.message === "validation error") {
                Object.entries(response.data.errors || {}).forEach(([field, message]) => {
                  setFieldError(field, String(message));
                });
              } else {
                showSnackbar(response.data.message || "Request failed", "error");
              }
            } catch {
              showSnackbar("Failed to save template", "error");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, handleBlur, isSubmitting, setFieldValue }) => (
            <Form>
              <Stack gap={1}>
                <Box mb="10px">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Name{type === "add" && <span style={{ color: "red" }}>*</span>}
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
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Subject{type === "add" && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <CustomTextField
                    name="subject"
                    type="text"
                    placeholder="Enter template subject"
                    value={values.subject}
                    onChange={(val) => setFieldValue("subject", val)}
                    onBlur={handleBlur}
                  />
                  <ErrorText name="subject" />
                </Box>

                <Box mb="10px">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Body{type === "add" && <span style={{ color: "red" }}>*</span>}
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
                        if (res.data?.success) {
                          const text = String(res.data.data || "");
                          const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
                          const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
                          if (subjectMatch?.[1]) setFieldValue("subject", subjectMatch[1].trim());
                          if (bodyMatch?.[1]) setFieldValue("body", bodyMatch[1].trim());
                          showSnackbar("Template content generated", "success");
                        } else {
                          showSnackbar(res.data?.error || "Failed to generate", "error");
                        }
                      } catch {
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
                    onChange={(val) => setFieldValue("body", val)}
                    onBlur={handleBlur}
                    multiline
                    minRows={10}
                  />
                  <ErrorText name="body" />
                </Box>

                <Box mb="10px">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">Attached Documents</Typography>
                    <Button size="small" startIcon={<Paperclip size={14} />} onClick={() => setPickerOpen(true)}>
                      Attach Document
                    </Button>
                  </Stack>
                  <AttachmentPreviewList
                    attachments={attachments}
                    onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                  />
                </Box>

                <Box mb="10px">
                  <FormControlLabel
                    control={
                      <Android12Switch
                        checked={values.isPublic}
                        onChange={(val) => setFieldValue("isPublic", val.target.checked)}
                      />
                    }
                    label="Choose to make this template public"
                  />
                </Box>

                <Box sx={{ width: "40%", minWidth: "150px", alignSelf: "end" }}>
                  <CustomButton
                    text={isSubmitting ? "Saving..." : type === "add" ? "Create Template" : "Update Template"}
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  />
                </Box>
              </Stack>
            </Form>
          )}
        </Formik>
      </Stack>

      <AttachmentPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        parentId={draftParentId}
        parentType="email_template"
        selected={attachments}
        onChange={setAttachments}
      />
    </>
  );
}
