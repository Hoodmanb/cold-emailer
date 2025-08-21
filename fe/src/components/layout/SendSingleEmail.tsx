"use client"
import { Stack, Box, Button, Typography, IconButton, FormControlLabel } from "@mui/material";
import { useGlobalModal } from "../ui/Modal";
import CustomTextField from "@/components/ui/TextField";
import {
    SendEmailSchema, SendEmailWithSavedData
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
    useGetSingleRecipient,
    useFetchSingleCategory,
} from "@/hooks/queryHooks";
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

export default function SendSingleEmail() {
    const { closeModal } = useGlobalModal();
    const { showSnackbar } = useSnackbar();
    const [templateList, setTemplateList] = useState<OutputType[]>([]);
    const { categories, refetchCategories } = useFetchCategory("/api/category");
    const { template, loading, refetch } = useGetTemplates()
    const [templateValue, setTemplateValue] = useState<string>("")
    const [checked, setChecked] = useState<boolean>(false)

    const transformCategory = (): OutputType[] => {
        let lists
        lists = template ? template.map((item) => ({
            value: item._id,
            label: item.name,
        })) : [];
        return lists;
    };

    useEffect(() => {
        setTemplateList(transformCategory());
    }, [template]);

    // useEffect(() => {

    //         setRefresh(); 
    // }, []);

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
                <Typography fontWeight={"bold"}>
                    Send Email
                </Typography>
                <IconButton onClick={closeModal}>
                    <XIcon />
                </IconButton>
            </Stack>
            <Box mb="10px">
                <FormControlLabel
                    control={
                        <Android12Switch
                            checked={checked}
                            onChange={(val) => {
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
                    label="choose to make this template public"
                />
                <Typography fontSize={"0.8em"}>
                    Note: Your template will be reviewed to decide whether it can
                    be public.
                </Typography>
            </Box>

            <Formik
                initialValues={!checked ? {
                    to: "",
                    subject: "",
                    body: "",
                } : {
                    templateId: "",
                    to: ""
                }}
                // enableReinitialize={true}
                validationSchema={checked ? SendEmailWithSavedData : SendEmailSchema}
                onSubmit={async (
                    values,
                    { setSubmitting, resetForm, setFieldError }
                ) => {
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
                            {!checked && (<Box><Box mb="10px">
                                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
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
                                    <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                                        Body
                                        <span style={{ color: "red" }}>*</span>
                                    </Typography>
                                    <CustomTextField
                                        name="body"
                                        multiline
                                        rows={4}
                                        type="text"
                                        placeholder="Enter body of email"
                                        value={values.subject || ""}
                                        onChange={(val) => {
                                            setFieldValue("body", val);
                                        }}
                                        onBlur={handleBlur}
                                    />
                                    <ErrorText name="body" />
                                </Box></Box>)}
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
                                            const selected = template?.find(t => t._id === val);
                                            setTemplateValue(selected?.name || "");
                                            setFieldValue("templateId", val);
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
                                    disabled={
                                        // Object.entries(values)
                                        //     .filter(([key]) => key !== "category")
                                        //     .some(([, val]) => !val.trim()) ||
                                        Object.keys(errors).length > 0 ||
                                        isSubmitting
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
