"use client";

import { logger } from "@/utils/logger";
import {
  Stack,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Autocomplete,
  TextField,
  Chip,
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
import { XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useMemo, useState } from "react";
import { useGetTemplates, useGetRecipients, useSuggestions, trackSuggestionUsage } from "@/hooks/queryHooks";
import { Android12Switch } from "../ui/Switch";
import { cleanFormValues } from "@/utils/cleanFormValues";

type TemplateOpt = {
  id: string;
  label: string;
  subject: string;
  snippet: string;
  group: string;
};

type RecipientOpt = {
  id: string;
  email: string;
  name: string;
  group: string;
};

export default function SendSingleEmail() {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const { template } = useGetTemplates();
  const { recipient } = useGetRecipients();
  const { suggestedRecipients, suggestedTemplates, suggestedSmtp, refresh } = useSuggestions(10);

  const [checked, setChecked] = useState<boolean>(false);

  const recipientOptions: RecipientOpt[] = useMemo(() => {
    const sug = (suggestedRecipients || []).map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name || "",
      group: "Recent / frequent",
    }));
    const seen = new Set(sug.map((s) => s.email.toLowerCase()));
    const rest = (recipient || [])
      .filter((r) => r.email && !seen.has(r.email.toLowerCase()))
      .map((r) => ({
        id: r._id,
        email: r.email,
        name: r.name || "",
        group: "All contacts",
      }));
    return [...sug, ...rest];
  }, [suggestedRecipients, recipient]);

  const templateAutocompleteOptions: TemplateOpt[] = useMemo(() => {
    const sug = (suggestedTemplates || []).map((t) => ({
      id: t.id,
      label: t.name,
      subject: t.subject || "",
      snippet: t.bodySnippet || "",
      group: "Recent / frequent",
    }));
    const sugIds = new Set(sug.map((s) => s.id));
    const rest = (template || [])
      .filter((t) => t._id && !sugIds.has(t._id))
      .map((t) => ({
        id: t._id,
        label: t.name,
        subject: t.subject || "",
        snippet: (t.body || "").replace(/<[^>]+>/g, " ").slice(0, 100).trim(),
        group: "All templates",
      }));
    return [...sug, ...rest];
  }, [suggestedTemplates, template]);

  const applyLastRecipient = (setFieldValue: (f: string, v: string) => void) => {
    const top = suggestedRecipients[0];
    if (top?.email) setFieldValue("to", top.email);
  };

  const applyLastTemplate = (setFieldValue: (f: string, v: string) => void) => {
    const t = templateAutocompleteOptions[0];
    if (!t) return;
    setFieldValue("templateId", t.id);
    void trackSuggestionUsage({ type: "template", id: t.id });
  };

  return (
    <Stack
      sx={{
        backgroundColor: "white",
        borderRadius: "20px",
        p: "25px",
        width: "80%",
        minWidth: "250px",
        maxWidth: 520,
      }}
    >
      <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} mb={2}>
        <Typography fontWeight={"bold"}>Send Email</Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        enableReinitialize
        initialValues={
          !checked
            ? { to: "", subject: "", body: "", templateId: "" }
            : { to: "", templateId: "", subject: "", body: "" }
        }
        validationSchema={checked ? SendEmailWithSavedData : SendEmailSchema}
        onSubmit={async (values, { setSubmitting, resetForm, setFieldError }) => {
          setSubmitting(true);
          logger.debug(cleanFormValues(values));
          const response = await axiosInstance.post("/api/email", cleanFormValues(values));
          const data = response.data;
          logger.debug(response.data);
          if (data.success) {
            showSnackbar(data.message, "success");
            resetForm();
            void refresh();
          } else if (data.errors) {
            if (data.errors.to) setFieldError("to", data.errors.to);
            if (data.errors.subject) setFieldError("subject", data.errors.subject);
            if (data.errors.body) setFieldError("body", data.errors.body);
            showSnackbar(data.message || "error sending email", "error");
          } else {
            showSnackbar(data.message || "error sending email", "error");
          }
          setSubmitting(false);
        }}
      >
        {({ values, errors, handleBlur, isSubmitting, setFieldValue }) => (
          <Form>
            <Stack gap={1.5}>
              <Box>
                <FormControlLabel
                  control={
                    <Android12Switch
                      checked={checked}
                      onChange={(val) => {
                        setFieldValue("subject", "");
                        setFieldValue("body", "");
                        setFieldValue("templateId", "");
                        setFieldValue("to", values.to);
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
                  label="Use a saved email template"
                />
              </Box>

              {suggestedSmtp[0] ? (
                <Typography variant="caption" color="text.secondary">
                  Recently used SMTP: {suggestedSmtp[0].email}
                  {suggestedSmtp[0].isDefault ? " (default)" : ""}
                </Typography>
              ) : null}

              <Box>
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Recipient email<span style={{ color: "red" }}>*</span>
                </Typography>
                <Autocomplete
                  freeSolo
                  options={recipientOptions}
                  groupBy={(o) => o.group}
                  getOptionLabel={(o) =>
                    typeof o === "string" ? o : o.name ? `${o.name} · ${o.email}` : o.email
                  }
                  inputValue={values.to}
                  onInputChange={(_, v) => setFieldValue("to", v)}
                  onChange={(_, opt) => {
                    if (!opt || typeof opt === "string") return;
                    setFieldValue("to", opt.email);
                    void trackSuggestionUsage({ type: "recipient", id: opt.id });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Type or pick a saved recipient"
                      onBlur={handleBlur}
                      name="to"
                    />
                  )}
                />
                <ErrorText name="to" />
                <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                  {suggestedRecipients[0] ? (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Use last recipient"
                      onClick={() => applyLastRecipient(setFieldValue)}
                    />
                  ) : null}
                </Stack>
              </Box>

              {!checked && (
                <Box>
                  <Box mb="10px">
                    <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                      Subject<span style={{ color: "red" }}>*</span>
                    </Typography>
                    <CustomTextField
                      name="subject"
                      type="text"
                      placeholder="Subject"
                      value={values.subject || ""}
                      onChange={(val) => setFieldValue("subject", val)}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="subject" />
                  </Box>
                  <Box mb="10px">
                    <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                      Body<span style={{ color: "red" }}>*</span>
                    </Typography>
                    <CustomTextField
                      name="body"
                      multiline
                      rows={4}
                      type="text"
                      placeholder="Message"
                      value={values.body || ""}
                      onChange={(val) => setFieldValue("body", val)}
                      onBlur={handleBlur}
                    />
                    <ErrorText name="body" />
                  </Box>
                </Box>
              )}

              {checked && (
                <Box>
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Template<span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Autocomplete
                    options={templateAutocompleteOptions}
                    groupBy={(o) => o.group}
                    getOptionLabel={(o) => o.label}
                    value={
                      templateAutocompleteOptions.find((o) => o.id === values.templateId) || null
                    }
                    onChange={(_, opt) => {
                      setFieldValue("templateId", opt?.id || "");
                      if (opt?.id) void trackSuggestionUsage({ type: "template", id: opt.id });
                    }}
                    renderOption={(props, opt) => (
                      <li {...props} key={opt.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {opt.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {opt.subject}
                          </Typography>
                          {opt.snippet ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", opacity: 0.85, maxWidth: 360 }}
                              noWrap
                            >
                              {opt.snippet}
                            </Typography>
                          ) : null}
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Search templates"
                        onBlur={handleBlur}
                        name="templateId"
                      />
                    )}
                  />
                  <ErrorText name="templateId" />
                  {templateAutocompleteOptions[0] ? (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Use last template"
                      sx={{ mt: 0.75 }}
                      onClick={() => applyLastTemplate(setFieldValue)}
                    />
                  ) : null}
                </Box>
              )}

              <Box sx={{ width: "40%", minWidth: "150px", alignSelf: "end" }}>
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
