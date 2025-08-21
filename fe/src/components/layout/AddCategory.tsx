import { Stack, Box, Typography, IconButton } from "@mui/material";
import { useGlobalModal } from "../ui/Modal";
import CustomTextField from "@/components/ui/TextField";
import * as Yup from "yup";
import { ErrorText } from "@/components/ui/ErrorText";
import { Form, Formik } from "formik";
import { useSnackbar } from "@/context/SnackbarContext";
import { XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useFetchSingleCategory } from "@/hooks/queryHooks";
import { useEffect } from "react";

const AddCategoryValidationSchema = Yup.object().shape({
  category: Yup.string().required("Category is required"),
});

type prop = {
  type: "add" | "update";
  categoryId?: string;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AddCategory({ type, categoryId, setRefresh }: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const { category, refetchCategory } = useFetchSingleCategory(categoryId);

  useEffect(() => {
      if (type === "update") {
        refetchCategory(); // Only refetch if it's update
      }
    }, [type]);

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
          {type === "add" ? "Add New Category" : "Update Category"}
        </Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={{
          category: category?.category || "",
        }}
        enableReinitialize={type === "update"}
        validationSchema={AddCategoryValidationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          const response =
            type === "add"
              ? await axiosInstance.post("/api/category", values)
              : await axiosInstance.put(`/api/category/${categoryId}`, values);
          if (
            response.data.message === "category updated successful" ||
            response.data.message === "category created successful"
          ) {
            showSnackbar(response.data.message, "success");
            setRefresh((prev) => !prev);
            resetForm();
            closeModal();
          } else {
            showSnackbar(
              response.data.message || "an error occured, try again",
              "error"
            );
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
                  Category Name <span style={{ color: "red" }}>*</span>
                </Typography>
                <CustomTextField
                  name="category"
                  type="text"
                  placeholder="Enter category name"
                  value={values.category}
                  onChange={(val) => setFieldValue("category", val)}
                  onBlur={handleBlur}
                  required
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
                    Object.values(values).some((val) => !val.trim()) ||
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
