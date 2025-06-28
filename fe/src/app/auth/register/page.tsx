"use client";
import React, { useState } from "react";
import { Formik } from "formik";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Link,
} from "@mui/material";
import { Mail, User, Lock, EyeIcon, EyeOff } from "lucide-react";
import CustomTextField from "@/components/ui/TextField";
import { registerValidationSchema } from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { register } from "@/hooks/userAuth";
import { useSnackbar } from "@/context/SnackbarContext";
import { CircularProgress } from "@mui/material";
import axiosInstance from "@/hooks/axios";
import { useRouter } from "next/navigation";

// import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const [response, setResponse] = useState("");
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #eff6ff, #e0e7ff)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: "25rem",
          m: "40px",
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" fontWeight="bold" textAlign="center">
              Create Account
            </Typography>
          }
          subheader={
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Start your cold email campaigns today
            </Typography>
          }
        />
        <CardContent>
          <Formik
            initialValues={{
              email: "",
              password: "",
              displayName: "",
              gmailPassword: "",
            }}
            validationSchema={registerValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              setResponse("Creating user...");
              const { email, password, displayName, gmailPassword } = values;

              try {
                const res = await register({ email, password, displayName });

                if (!res.success) {
                  showSnackbar(res.message, "error");
                  setSubmitting(false);
                  return;
                }

                showSnackbar("Account created successfully", "success");

                setResponse("Saving app password...");
                // resetForm();
                const savePasswordRes = await axiosInstance.post("/api/user", {
                  appPassword: gmailPassword,
                  email,
                });
                console.log(savePasswordRes);
                if (
                  savePasswordRes.data.message === "user created successfully"
                ) {
                  showSnackbar("App password saved successfully", "success");
                } else {
                  showSnackbar("Failed to save app password", "error");
                }
                resetForm();
                setSubmitting(false);
                router.push("/dashboard"); // You were spelling it "dshboard" — confirm that’s not a typo
              } catch (error) {
                showSnackbar("An error occurred, please try again", "error");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
              /* and other goodies */
            }) => (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box mb="10px">
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Display Name
                  </Typography>

                  <CustomTextField
                    icon={User}
                    name="displayName"
                    type="text"
                    placeholder="Enter a display name"
                    value={values.displayName}
                    onChange={(val) => setFieldValue("displayName", val)}
                    onBlur={handleBlur}
                    required
                  />
                  <ErrorText name="displayName" />
                </Box>

                <Box mb="10px">
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Email
                  </Typography>
                  <CustomTextField
                    icon={Mail}
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={(val) => setFieldValue("email", val)}
                    onBlur={handleBlur}
                    required
                  />
                  <ErrorText name="email" />
                </Box>

                <Box mb="10px">
                  <Typography variant="body2" fontWeight={"bold"} gutterBottom>
                    Password
                  </Typography>
                  <CustomTextField
                    icon={Lock}
                    iconOne={EyeOff}
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={values.password}
                    onChange={(val) => setFieldValue("password", val)}
                    onBlur={handleBlur}
                    required
                  />
                  <ErrorText name="password" />
                </Box>

                <Box mb="10px">
                  <Typography
                    variant="body2"
                    fontWeight={"bolder"}
                    gutterBottom
                  >
                    Gmail App Password
                  </Typography>
                  <CustomTextField
                    icon={Lock}
                    iconOne={EyeOff}
                    name="gmailPassword"
                    type="password"
                    placeholder="Enter your gmail app password"
                    value={values.gmailPassword}
                    onChange={(val) => setFieldValue("gmailPassword", val)}
                    onBlur={handleBlur}
                    required
                  />
                  <ErrorText name="gmailPassword" />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: "#0F172A",
                    textTransform: "none",
                  }}
                  disabled={
                    Object.values(values).some((val) => !val.trim()) ||
                    Object.keys(errors).length > 0 ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      {response && <span>{response}</span>}
                      <CircularProgress size={20} sx={{ ml: 1 }} />
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Box>
            )}
          </Formik>
          <Box mt={2} textAlign="center">
            <Typography variant="subtitle2" color="text.secondary">
              Already have an account?{" "}
              <Link
                component="button"
                onClick={() => router.push("/auth/login")}
                underline="hover"
                color="#0F172A"
                sx={{ fontWeight: "bold", fontSize: "12px" }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
