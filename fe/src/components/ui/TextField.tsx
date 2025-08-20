import React from "react";
import {
  TextField as MuiTextField,
  InputAdornment,
  TextFieldProps,
  IconButton,
} from "@mui/material";
import { LucideIcon } from "lucide-react";

interface CustomTextFieldProps extends Omit<TextFieldProps, "onChange"> {
  icon?: LucideIcon;
  iconOne?: LucideIcon;
  iconColor?: string;
  value: string;
  onChange: (value: string) => void;
}

const CustomTextField: React.FC<CustomTextFieldProps> = ({
  icon: Icon,
  iconOne: IconOne,
  iconColor = "gray",
  fullWidth = true,
  size = "small",
  onChange,
  value = "",
  ...rest
}) => {
  return (
    <MuiTextField
      size={size}
      fullWidth={fullWidth}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        sx: {
          fontSize: "14px",
          pr: 2,
          "& input::placeholder": {
            color: "text.secondary", // or '#999' or any HEX
            opacity: 1, // ensure it's visible
          },
        },
        startAdornment: Icon && (
          <InputAdornment position="start">
            <Icon size={16} style={{ color: iconColor }} />
          </InputAdornment>
        ),
        endAdornment: IconOne && (
          <InputAdornment position="end">
            <IconButton edge="end">
              <IconOne size={16} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
};

export default CustomTextField;
