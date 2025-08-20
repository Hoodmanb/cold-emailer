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
import { X, XIcon } from "lucide-react";
import CustomButton from "../ui/Button";
import axiosInstance from "@/hooks/axios";
import { useEffect, useRef, useState } from "react";
import { useFetchCategory, useGetRecipients } from "@/hooks/queryHooks";
import { Android12Switch } from "../ui/Switch";
import MultiSelectChip from "../ui/Select";

type prop = {
  type: "add" | "update";
  scheduleID?: string;
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

export default function CreateSchedule({
  type,
  scheduleID,
  setRefresh,
}: prop) {
  const { closeModal } = useGlobalModal();
  const { showSnackbar } = useSnackbar();
  const [mounted, setMounted] = useState(false);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const { categories, refetchCategories } = useFetchCategory("/api/category");
  const { recipient, loading, error, refetch } = useGetRecipients();
  const [isSelectCategory, setIsSelectCategory] = useState(false);

  // const [myFrequency, setFrequency] = useState("");
  // const [dayOption, setDayOption] = useState<OutputType[]>([]);

  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  const handleChange = () => {
    setIsSelectCategory((prev) => !prev);
  };

  const transformCategory = (): string[] => {
    const lists = categories.map((item) => item.category);
    return lists;
  };

  const extractRecipients = (): string[] => {
    const lists = recipient ? recipient.map((item) => item.email) : [];
    return lists;
  };

  const [myFrequency, setFrequency] = useState("");
  const [dayOption, setDayOption] = useState<OutputType[]>([]);

  useEffect(() => {
    if (myFrequency) {
      const limit = myFrequency === "Weekly" ? 7 : 31;
      const options = Array.from({ length: limit }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      }));
      setDayOption(options);
    }
  }, [myFrequency]);

  useEffect(() => {
    setCategoryList(transformCategory());
    setMounted(true);
  }, [categories]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    if (boxRef.current) {
      observer.observe(boxRef.current);
    }

    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return;

  return (
    <Stack
      ref={boxRef}
      sx={{
        backgroundColor: "white",
        borderRadius: "20px",
        p: "25px",
        width: "80%",
        minWidth: "250px",
        maxWidth: "500px",
        maxHeight: "90vh", // 🔥 Limit the height
        overflowY: "auto", // 🔥 Make content scroll vertically
      }}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        mb={2}
      >
        <Typography fontWeight={"bold"}>
          {type === "add" ? "Create Email Schedule" : " Update Recipient"}
        </Typography>
        <IconButton onClick={closeModal}>
          <XIcon />
        </IconButton>
      </Stack>
      <Formik
        initialValues={{
          name: "",
          frequency: "",
          day: "",
          hour: "",
          recipients: [],
          template: "",
          templateOne: "",
          templateTwo: "",
          templateThree: "",
        }}
        validationSchema={
          type === "add"
            ? CreateScheduleValidationSchema
            : UpdateRecipientValidationSchema
        }
        onSubmit={async (
          values,
          { setSubmitting, resetForm, setFieldError }
        ) => {
          console.log(values);
          // const matchedCategory = categories?.find(
          //   (cat) => cat.category === values.category
          // );

          // if (matchedCategory) {
          //   values.category = matchedCategory._id;
          // }
          const response =
            type === "add"
              ? await axiosInstance.post("/api/schedule", values)
              : scheduleID
                ? await axiosInstance.put(
                  `/api/schedule/${scheduleID}`,
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
          setFieldError,
        }) => (
          <Form>
            <Stack gap={1}>
              <Stack
                sx={{
                  flexDirection:
                    width < 430 ? "column" : { xs: "column", sm: "row" },
                  gap: "10px",
                }}
              >
                <Box
                  mb="10px"
                  sx={{ width: width < 430 ? "100%" : { sm: "50%" } }}
                >
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
                <Box
                  mb="10px"
                  sx={{ width: width < 430 ? "100%" : { sm: "50%" } }}
                >
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Frequency
                    {type === "add" && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <SelectOption
                    name="frequency"
                    label="Select interval"
                    value={values.frequency}
                    onChange={(val) => {
                      setFieldValue("frequency", val);
                      console.log("Number(values.day)", Number(values.day));
                      if (val !== myFrequency && val === "Weekly") {
                        if (Number(values.day) > 7) {
                          setFieldValue("day", "");
                        }
                      }
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
              <Stack
                sx={{
                  flexDirection:
                    width < 430 ? "column" : { xs: "column", sm: "row" },
                  gap: "10px",
                }}
              >
                <Box
                  mb="10px"
                  sx={{ width: width < 430 ? "100%" : { sm: "50%" } }}
                >
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Day
                    {type === "add" && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <SelectOption
                    name="day"
                    label="Select day to run"
                    value={values.day}
                    onChange={(val) => setFieldValue("day", Number(val))}
                    options={dayOption}
                    onBlur={handleBlur}
                  />
                  <ErrorText name="day" />
                </Box>
                <Box
                  mb="10px"
                  sx={{ width: width < 430 ? "100%" : { sm: "50%" } }}
                >
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Hour
                    {type === "add" && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <SelectOption
                    name="hour"
                    label="Select hour to run"
                    value={values.hour}
                    onChange={(val) => setFieldValue("hour", Number(val))}
                    options={Array.from({ length: 24 }, (_, i) => ({
                      label: String(i + 1),
                      value: String(i + 1),
                    }))}
                    onBlur={handleBlur}
                  />
                  <ErrorText name="hour" />
                </Box>
              </Stack>
              <FormControlLabel
                control={
                  <Android12Switch
                    checked={isSelectCategory}
                    onChange={() => {
                      handleChange();
                      setFieldValue("recipients", []);
                    }}
                  />
                }
                sx={{
                  ".MuiFormControlLabel-label": {
                    fontSize: "12px",
                    fontWeight: "600",
                  },
                }}
                label="Select a category of recipient to register all"
              />
              <Stack
                sx={{
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                  Recipients
                  {type === "add" && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <Box mb="10px" sx={{ width: "100%" }}>
                  {isSelectCategory ? (
                    <MultiSelectChip
                      name="recipients"
                      placeholder="Select a category"
                      options={transformCategory()}
                      value={values.recipients}
                      onChange={(val) => setFieldValue("recipients", val)}
                      width={"100%"}
                      onBlur={handleBlur}
                    />
                  ) : (
                    <MultiSelectChip
                      name="recipients"
                      placeholder="Select recipients"
                      options={extractRecipients()}
                      value={values.recipients}
                      onChange={(val) => setFieldValue("recipients", val)}
                      width={"100%"}
                      onBlur={handleBlur}
                    />
                  )}
                  <ErrorText name="recipients" />
                </Box>
              </Stack>
              <Stack
                sx={{
                  width: "100%",
                  justifyContent: "space-between",
                  flexDirection:
                    values.template && width > 430 ? "row" : "column",
                  // gap: "10px",
                }}
              >
                {/* Template 1 */}
                <Box
                  mb="10px"
                  sx={{
                    width: !values.template || width < 430 ? "100%" : "48%",
                  }}
                >
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Template 1
                    {type === "add" && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <Stack direction={"row"}>
                    <SelectOption
                      name="template"
                      label="Select first template to run"
                      value={values.template}
                      onChange={(val) => {
                        setFieldValue("template", val);
                        if (!val) {
                          setFieldValue("templateOne", "");
                          setFieldValue("templateTwo", "");
                          setFieldValue("templateThree", "");
                        }
                      }}
                      options={Array.from({ length: 24 }, (_, i) => ({
                        label: String(i + 1),
                        value: String(i + 1),
                      }))}
                      onBlur={handleBlur}
                    />
                    {values.template && (
                      <IconButton
                        sx={{ p: "1px" }}
                        onClick={() => {
                          setFieldValue("template", "");
                          setFieldValue("templateOne", "");
                          setFieldValue("templateTwo", "");
                          setFieldValue("templateThree", "");
                        }}
                      >
                        <X size={"0.6em"} color="red" />
                      </IconButton>
                    )}
                  </Stack>
                  <ErrorText name="template" />
                </Box>

                {/* Template 2 */}
                {values.template && (
                  <Box
                    mb="10px"
                    sx={{
                      width: !values.template || width < 430 ? "100%" : "45%",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={"bold"}
                      gutterBottom
                    >
                      Template 2
                    </Typography>
                    <Stack direction={"row"}>
                      <SelectOption
                        name="templateOne"
                        label="Select second template to run"
                        value={values.templateOne}
                        onChange={(val) => {
                          setFieldValue("templateOne", val);
                          if (!val) {
                            setFieldValue("templateTwo", "");
                            setFieldValue("templateThree", "");
                          }
                        }}
                        options={Array.from({ length: 24 }, (_, i) => ({
                          label: String(i + 1),
                          value: String(i + 1),
                        }))}
                        onBlur={handleBlur}
                      />
                      {values.templateOne && (
                        <IconButton
                          sx={{ p: "1px" }}
                          onClick={() => {
                            setFieldValue("templateOne", "");
                            setFieldValue("templateTwo", "");
                            setFieldValue("templateThree", "");
                          }}
                        >
                          <X size={"0.6em"} color="red" />
                        </IconButton>
                      )}
                    </Stack>
                    <ErrorText name="templateOne" />
                  </Box>
                )}
              </Stack>

              {values.template && values.templateOne && (
                <Stack
                  sx={{
                    flexDirection:
                      values.templateTwo && width > 430 ? "row" : "column",
                    gap: "10px",
                  }}
                >
                  {/* Template 3 */}
                  {values.templateOne && (
                    <Box
                      mb="10px"
                      sx={{
                        width:
                          !values.templateOne || width < 430 ? "100%" : "45%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={"bold"}
                        gutterBottom
                      >
                        Template 3
                      </Typography>
                      <Stack direction={"row"}>
                        <SelectOption
                          name="templateTwo"
                          label="Select third template to run"
                          value={values.templateTwo}
                          onChange={(val) => {
                            setFieldValue("templateTwo", val);
                            if (!val) {
                              setFieldValue("templateThree", "");
                            }
                          }}
                          options={Array.from({ length: 24 }, (_, i) => ({
                            label: String(i + 1),
                            value: String(i + 1),
                          }))}
                          onBlur={handleBlur}
                        />
                        {values.templateTwo && (
                          <IconButton
                            sx={{ p: "1px" }}
                            onClick={() => {
                              setFieldValue("templateTwo", "");
                              setFieldValue("templateThree", "");
                            }}
                          >
                            <X size={"0.6em"} color="red" />
                          </IconButton>
                        )}
                      </Stack>
                      <ErrorText name="templateTwo" />
                    </Box>
                  )}

                  {/* Template 4 */}
                  {values.templateTwo && (
                    <Box
                      mb="10px"
                      sx={{
                        width:
                          !values.templateOne || width < 430 ? "100%" : "45%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={"bold"}
                        gutterBottom
                      >
                        Template 4
                      </Typography>
                      <Stack direction={"row"}>
                        <SelectOption
                          name="templateThree"
                          label="Select fourth template to run"
                          value={values.templateThree}
                          onChange={(val) =>
                            setFieldValue("templateThree", val)
                          }
                          options={Array.from({ length: 24 }, (_, i) => ({
                            label: String(i + 1),
                            value: String(i + 1),
                          }))}
                          onBlur={handleBlur}
                        />
                        {values.templateThree && (
                          <IconButton
                            sx={{ p: "1px" }}
                            onClick={() => setFieldValue("templateThree", "")}
                          >
                            <X size={"0.6em"} color="red" />
                          </IconButton>
                        )}
                      </Stack>
                      <ErrorText name="templateThree" />
                    </Box>
                  )}
                </Stack>
              )}

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
                        .filter(
                          ([key]) =>
                            ![
                              "templateOne",
                              "templateTwo",
                              "templateThree",
                            ].includes(key)
                        )
                        .some(
                          ([, val]) =>
                            (typeof val === "string" && !val.trim()) ||
                            (Array.isArray(val) && val.length === 0)
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
