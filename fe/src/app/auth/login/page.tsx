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
import { Mail, Lock, EyeIcon, EyeOff } from "lucide-react";
import CustomTextField from "@/components/ui/TextField";
import { loginValidationSchema } from "@/utils/validationSchemas";
import { ErrorText } from "@/components/ui/ErrorText";
import { login } from "@/hooks/userAuth";
import { useSnackbar } from "@/context/SnackbarContext";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const Login = () => {
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
              Welcome Back!
            </Typography>
          }
          subheader={
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Sign in to your cold emailer dashboard
            </Typography>
          }
        />
        <CardContent>
          <Formik
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={loginValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              setResponse("Processing...");
              const { email, password } = values;

              try {
                const res = await login({ email, password });

                if (!res.success) {
                  showSnackbar(res.message, "info");
                  setSubmitting(false);
                  return;
                }

                showSnackbar("Login successfully", "success");
                resetForm();
                router.push("/dashboard");
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
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            }) => (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
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
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(val) => setFieldValue("password", val)}
                    onBlur={handleBlur}
                    required
                  />
                  <ErrorText name="password" />
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
                    "Sign In"
                  )}
                </Button>
              </Box>
            )}
          </Formik>
          <Box mt={2} textAlign="center">
            <Typography variant="subtitle2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                component="button"
                onClick={() => router.push("/auth/register")}
                underline="hover"
                color="#0F172A"
                sx={{ fontWeight: "bold", fontSize: "12px" }}
              >
                Register
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
