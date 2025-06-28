// utils/validationSchemas.ts
import * as Yup from "yup";

export const registerValidationSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, "Display name must be at least 2 characters")
    .required("Display name is required"),

  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[@$!%*?&#]/, "Must contain at least one special character")
    .required("Password is required"),

  gmailPassword: Yup.string()
    .min(6, "Gmail App Password must be at least 6 characters")
    .required("Gmail App Password is required"),
});

export const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export const AddRecipientValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),

  name: Yup.string().required("Name is required"),

  category: Yup.string(),
});

export const UpdateRecipientValidationSchema = Yup.object().shape({
  email: Yup.string().email("Enter a valid email"),

  name: Yup.string(),

  category: Yup.string(),

  newEmail: Yup.string(),
});

export const CreateScheduleValidationSchema = Yup.object().shape({
  name: Yup.string().required("name is required"),
  frequency: Yup.string().required("frequency is required"),
  day: Yup.string().required("day is required"),
  hour: Yup.string().required("hour is required"),
  recipients: Yup.array()
    .of(Yup.string().required("Recipient is required"))
    .min(1, "At least one recipient is required")
    .required("Recipients are required"),

  template: Yup.string().required("Template is required"),

  templateOne: Yup.string().test(
    "template-one-check",
    "Template is required before Template One",
    function (val) {
      const { template } = this.parent;
      if (val && !template) return false;
      return true;
    }
  ),

  templateTwo: Yup.string().test(
    "template-two-check",
    "Template One is required before Template Two",
    function (val) {
      const { templateOne } = this.parent;
      if (val && !templateOne) return false;
      return true;
    }
  ),

  templateThree: Yup.string().test(
    "template-three-check",
    "Template Two is required before Template Three",
    function (val) {
      const { templateTwo } = this.parent;
      if (val && !templateTwo) return false;
      return true;
    }
  ),
});
