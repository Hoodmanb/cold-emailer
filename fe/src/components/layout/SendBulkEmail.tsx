"use client";
import {
  Stack,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
} from "@mui/material";
import { useGlobalModal } from "../ui/Modal";
import CustomTextField from "@/components/ui/TextField";
import {
  SendEmailSchema,
  SendEmailWithSavedData,
} from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { Form, Formik } from "formik";
import { useSnackbar } from "@/context/SnackbarContext";
import SelectOption from "../ui/Option";
import { XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import {
  useFetchCategory,
  useGetTemplates,
} from "@/hooks/queryHooks";
import { Android12Switch } from "../ui/Switch";
import { cleanFormValues } from "@/utils/cleanFormValues";

type OutputType = {
  label: string;
  value: string;
};

export default function SendBulkEmail() {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [templateList, setTemplateList] = useState<OutputType[]>([]);
  const { template } = useGetTemplates();
  const [templateValue, setTemplateValue] = useState<string>("");
  const [checked, setChecked] = useState<boolean>(false);

  const transformCategory = (): OutputType[] => {
    const lists = template
      ? template.map((item) => ({
          value: item._id,
          label: item.name,
        }))
      : [];
    return lists;
  };

  useEffect(() => {
    setTemplateList(transformCategory());
  }, [template]);

  return (
    <Stack
      sx={{
        backgroundColor: "white",
        borderRadius: "20px",
        p: "25px",
        width: "80%",
        minWidth: "250px",
        maxWidth: "500px",
      }}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        mb={2}
      >
        <Typography fontWeight={"bold"}>Send Email</Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={
          !checked
            ? {
                to: "",
                subject: "",
                body: "",
              }
            : {
                templateId: "",
                to: "",
              }
        }
        // enableReinitialize={true}
        validationSchema={checked ? SendEmailWithSavedData : SendEmailSchema}
        onSubmit={async (
          values,
          { setSubmitting, resetForm, setFieldError }
        ) => {
          setSubmitting(true);
          console.log(cleanFormValues(values));
          const response = await axiosInstance.post(
            "/api/email",
            cleanFormValues(values)
          );
          const data = response.data;
          console.log(response.data);
          if (data.success) {
            showSnackbar(data.message, "success");
            setTemplateValue("");
          resetForm();
          setSubmitting(false);
          } else if (data.errors) {
            data.errors.to ? setFieldError("to", data.errors.to) : "";
            data.errors.to ? setFieldError("subject", data.errors.subject) : "";
            data.errors.to ? setFieldError("body", data.errors.body) : "";
            showSnackbar(data.message || "error sending email", "error");
          }else{
             showSnackbar(data.message || "error sending email", "error");
          }
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
                <FormControlLabel
                  control={
                    <Android12Switch
                      checked={checked}
                      onChange={(val) => {
                        setFieldValue("subject", "");
                        setFieldValue("body", "");
                        setFieldValue("templateId", "");
                        setTemplateValue("");
                        setChecked(val.target.checked);
                      }}
                    />
                  }
                  sx={{
                    ".MuiFormControlLabel-label": {
                      fontSize: "12px",
                      fontWeight: "600",
                    },
                  }}
                  label="use an email template from your saved data"
                />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Recipient Email
                  <span style={{ color: "red" }}>*</span>
                </Typography>
                <CustomTextField
                  name="to"
                  type="email"
                  placeholder="Enter recipient email address"
                  value={values.to}
                  onChange={(val) => setFieldValue("to", val)}
                  onBlur={handleBlur}
                />
                <ErrorText name="to" />
              </Box>
              {!checked && (
                <Box>
                  <Box mb="10px">
                    <Typography
                      variant="body2"
                      fontWeight={"bold"}
                      gutterBottom
                    >
                      Subject
                      <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <CustomTextField
                      name="subject"
                      type="text"
                      placeholder="Enter subject of email"
                      value={values.subject || ""}
                      onChange={(val) => {
                        setFieldValue("subject", val);
                      }}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="subject" />
                  </Box>
                  <Box mb="10px">
                    <Typography
                      variant="body2"
                      fontWeight={"bold"}
                      gutterBottom
                    >
                      Body
                      <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <CustomTextField
                      name="body"
                      multiline
                      rows={4}
                      type="text"
                      placeholder="Enter body of email"
                      value={values.body || ""}
                      onChange={(val) => {
                        setFieldValue("body", val);
                      }}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="body" />
                  </Box>
                </Box>
              )}
              {checked && (
                <Box mb="10px">
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Template
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <SelectOption
                    name="templateId"
                    label="Select a template to use"
                    value={templateValue}
                    onChange={(val) => {
                      const selected = template?.find((t) => t.name === val);
                      setTemplateValue(val || "");
                      console.log("hi", selected?._id);
                      setFieldValue("templateId", selected?._id || "");
                    }}
                    options={templateList}
                    onBlur={handleBlur}
                  />
                  <ErrorText name="templateId" />
                </Box>
              )}
              <Box
                sx={{
                  width: "40%",
                  minWidth: "150px",
                  alignSelf: "end",
                }}
              >
                <CustomButton
                  text={isSubmitting ? "Sending..." : "Send"}
                  disabled={Object.keys(errors).length > 0 || isSubmitting}
                />
              </Box>
            </Stack>
          </Form>
        )}
      </Formik>
    </Stack>
  );
}
