import { Stack, Box, Button, Typography, IconButton } from "@mui/material";
import { useGlobalModal } from "../ui/Modal";
import CustomTextField from "@/components/ui/TextField";
import {
  AddRecipientValidationSchema,
  UpdateRecipientValidationSchema,
} from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { Form, Formik } from "formik";
import { useSnackbar } from "@/context/SnackbarContext";
import SelectOption from "../ui/Option";
import { XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useState } from "react";
import { useFetchCategory } from "@/hooks/queryHooks";

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

export default function AddRecipient({
  type,
  recipientEmail,
  setRefresh,
}: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [mounted, setMounted] = useState(false);
  const [categoryList, setCategoryList] = useState<OutputType[]>([]);
  const { categories, refetchCategories } = useFetchCategory("/api/category");

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
      }}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        mb={2}
      >
        <Typography fontWeight={"bold"}>
          {type === "add" ? "Add New Recipient" : " Update Recipient"}
        </Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={{
          name: "",
          email: "",
          category: "",
          newEmail: "",
        }}
        validationSchema={
          type === "add"
            ? AddRecipientValidationSchema
            : UpdateRecipientValidationSchema
        }
        onSubmit={async (
          values,
          { setSubmitting, resetForm, setFieldError }
        ) => {
          const matchedCategory = categories?.find(
            (cat) => cat.category === values.category
          );

          if (matchedCategory) {
            values.category = matchedCategory._id;
          }
          const response =
            type === "add"
              ? await axiosInstance.post("/api/recipient", values)
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
          if (response.data.message === "created successfully") {
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
                  placeholder="Enter recipient name"
                  value={values.name}
                  onChange={(val) => setFieldValue("name", val)}
                  onBlur={handleBlur}
                />
                <ErrorText name="name" />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Email
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <CustomTextField
                  name="email"
                  type="email"
                  placeholder="Enter their email address"
                  value={values.email}
                  onChange={(val) => {
                    setFieldValue("email", val);
                    setFieldValue("newEmail", val);
                  }}
                  onBlur={handleBlur}
                />
                <ErrorText name="email" />
              </Box>
              <Box mb="10px">
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Category
                  {/* {type === "add" && <span style={{ color: "red" }}>*</span>} */}
                </Typography>
                <SelectOption
                  name="category"
                  label="Select a supplier category"
                  value={values.category}
                  onChange={(val) => setFieldValue("category", val)}
                  options={categoryList}
                  onBlur={handleBlur}
                />
                <ErrorText name="category" />
              </Box>
              <Box
                sx={{
                  width: "40%",
                  minWidth: "150px",
                  alignSelf: "end",
                }}
              >
                <CustomButton
                  text={isSubmitting ? "Creating..." : "Create Recipient"}
                  disabled={
                    type === "add"
                      ? Object.entries(values)
                          .filter(([key]) => key !== "category")
                          .some(([, val]) => !val.trim()) ||
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
