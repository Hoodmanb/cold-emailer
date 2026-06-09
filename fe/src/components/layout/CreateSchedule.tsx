"use client";

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
  CreateScheduleValidationSchema,
  UpdateRecipientValidationSchema,
} from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { Form, Formik } from "formik";
import { useSnackbar } from "@/context/SnackbarContext";
import SelectOption from "../ui/Option";
import { Paperclip, X, XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useRef, useState } from "react";
import { IS_QSTASH_ENABLED, getSchedulerEndpoint } from "@/config/qstash";
import { useFetchCategory, useGetRecipients, useGetTemplates } from "@/hooks/queryHooks";
import { Android12Switch } from "../ui/Switch";
import MultiSelectChip from "../ui/Select";
import AttachmentPicker, { AttachmentPreviewList, type AttachmentRecord } from "@/components/attachments/AttachmentPicker";

type prop = {
  type: "add" | "update";
  scheduleID?: string;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

type OutputType = {
  label: string;
  value: string;
};

export default function CreateSchedule({ type, scheduleID, setRefresh }: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [mounted, setMounted] = useState(false);
  const { categories } = useFetchCategory("/api/category");
  const { recipient } = useGetRecipients();
  const { template: emailTemplates = [] } = useGetTemplates();
  const [isSelectCategory, setIsSelectCategory] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftParentId] = useState(() => `schedule-draft-${Date.now()}`);

  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  const transformCategory = (): string[] => categories.map((item) => item.category);
  const extractRecipients = (): string[] => (recipient ? recipient.map((item) => item.email) : []);

  const templateOptions: OutputType[] = emailTemplates.map((tpl: any) => ({
    label: tpl.name || tpl.subject,
    value: tpl._id,
  }));

  const [myFrequency, setFrequency] = useState("");
  const [dayOption, setDayOption] = useState<OutputType[]>([]);

  useEffect(() => {
    if (myFrequency) {
      const limit = myFrequency === "weekly" ? 7 : 31;
      setDayOption(Array.from({ length: limit }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })));
    }
  }, [myFrequency]);

  useEffect(() => {
    setMounted(true);
  }, [categories]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setWidth(entries[0].contentRect.width);
    });
    if (boxRef.current) observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <Stack
        ref={boxRef}
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
            {type === "add" ? "Create Email Schedule" : "Update Schedule"}
          </Typography>
          <IconButton onClick={closeModal}><XIcon /></IconButton>
        </Stack>

        <Formik
          initialValues={{
            name: "",
            frequency: "",
            day: "",
            hour: "",
            recipients: [] as string[],
            template: "",
            templateOne: "",
            templateTwo: "",
            templateThree: "",
          }}
          validationSchema={type === "add" ? CreateScheduleValidationSchema : UpdateRecipientValidationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
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

            const response =
              type === "add"
                ? await axiosInstance.post(getSchedulerEndpoint(), payload)
                : scheduleID
                  ? await axiosInstance.put(`${getSchedulerEndpoint()}/${scheduleID}`, payload)
                  : await axiosInstance.put(`${getSchedulerEndpoint()}/invalid`, payload);

            if (response.data.message === "created successfully" || response.data.message === "updated successfully") {
              showSnackbar(response.data.message, "success");
              setRefresh((prev) => !prev);
              closeModal();
              return resetForm();
            }
            showSnackbar(response.data.message || "Request failed", "error");
            setSubmitting(false);
          }}
        >
          {({ values, errors, isSubmitting, setFieldValue, handleBlur }) => (
            <Form>
              <Stack gap={1}>
                <Stack sx={{ flexDirection: width < 430 ? "column" : "row", gap: "10px" }}>
                  <Box mb="10px" sx={{ width: width < 430 ? "100%" : "50%" }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Name<span style={{ color: "red" }}>*</span></Typography>
                    <CustomTextField name="name" type="text" placeholder="Schedule name" value={values.name} onChange={(val) => setFieldValue("name", val)} onBlur={handleBlur} />
                    <ErrorText name="name" />
                  </Box>
                  <Box mb="10px" sx={{ width: width < 430 ? "100%" : "50%" }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Frequency<span style={{ color: "red" }}>*</span></Typography>
                    <SelectOption
                      name="frequency"
                      label="Select interval"
                      value={values.frequency}
                      onChange={(val) => {
                        setFieldValue("frequency", val);
                        if (val !== myFrequency && val === "weekly" && Number(values.day) > 7) setFieldValue("day", "");
                        setFrequency(val);
                      }}
                      options={[
                        { label: "Weekly", value: "weekly" },
                        { label: "Monthly", value: "monthly" },
                      ]}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="frequency" />
                  </Box>
                </Stack>

                <Stack sx={{ flexDirection: width < 430 ? "column" : "row", gap: "10px" }}>
                  <Box mb="10px" sx={{ width: width < 430 ? "100%" : "50%" }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Day<span style={{ color: "red" }}>*</span></Typography>
                    <SelectOption name="day" label="Select day" value={values.day} onChange={(val) => setFieldValue("day", Number(val))} options={dayOption} onBlur={handleBlur} />
                    <ErrorText name="day" />
                  </Box>
                  <Box mb="10px" sx={{ width: width < 430 ? "100%" : "50%" }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Hour<span style={{ color: "red" }}>*</span></Typography>
                    <SelectOption
                      name="hour"
                      label="Select hour"
                      value={values.hour}
                      onChange={(val) => setFieldValue("hour", Number(val))}
                      options={Array.from({ length: 24 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }))}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="hour" />
                  </Box>
                </Stack>

                <FormControlLabel
                  control={<Android12Switch checked={isSelectCategory} onChange={() => { setIsSelectCategory((p) => !p); setFieldValue("recipients", []); }} />}
                  label="Select a category of recipients"
                />

                <Box mb="10px">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>Recipients<span style={{ color: "red" }}>*</span></Typography>
                  <MultiSelectChip
                    name="recipients"
                    placeholder={isSelectCategory ? "Select categories" : "Select recipients"}
                    options={isSelectCategory ? transformCategory() : extractRecipients()}
                    value={values.recipients}
                    onChange={(val) => setFieldValue("recipients", val)}
                    width="100%"
                    onBlur={handleBlur}
                  />
                  <ErrorText name="recipients" />
                </Box>

                <Box mb="10px">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>Template 1<span style={{ color: "red" }}>*</span></Typography>
                  <SelectOption name="template" label="Primary email template" value={values.template} onChange={(val) => setFieldValue("template", val)} options={templateOptions} onBlur={handleBlur} />
                  <ErrorText name="template" />
                </Box>

                {values.template && (
                  <Box mb="10px">
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Template 2</Typography>
                    <SelectOption name="templateOne" label="Follow-up template" value={values.templateOne} onChange={(val) => setFieldValue("templateOne", val)} options={templateOptions} onBlur={handleBlur} />
                  </Box>
                )}

                {values.templateOne && (
                  <Box mb="10px">
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Template 3</Typography>
                    <SelectOption name="templateTwo" label="Third template" value={values.templateTwo} onChange={(val) => setFieldValue("templateTwo", val)} options={templateOptions} onBlur={handleBlur} />
                  </Box>
                )}

                {values.templateTwo && (
                  <Box mb="10px">
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Template 4</Typography>
                    <SelectOption name="templateThree" label="Fourth template" value={values.templateThree} onChange={(val) => setFieldValue("templateThree", val)} options={templateOptions} onBlur={handleBlur} />
                  </Box>
                )}

                <Box mb="10px">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">Attachments</Typography>
                    <Button size="small" startIcon={<Paperclip size={14} />} onClick={() => setPickerOpen(true)}>Add Attachment</Button>
                  </Stack>
                  <AttachmentPreviewList attachments={attachments} onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))} />
                </Box>

                <Box sx={{ width: "40%", minWidth: "150px", alignSelf: "end" }}>
                  <CustomButton
                    text={isSubmitting ? "Saving..." : type === "add" ? "Create Schedule" : "Update Schedule"}
                    disabled={isSubmitting}
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
        parentId={scheduleID || draftParentId}
        parentType="schedule"
        selected={attachments}
        onChange={setAttachments}
      />
    </>
  );
}
