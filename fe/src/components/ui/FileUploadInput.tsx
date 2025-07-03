import React, { useRef } from "react";
import {
  TextField as MuiTextField,
  InputAdornment,
  TextFieldProps,
  IconButton,
} from "@mui/material";
import { LucideIcon, Upload } from "lucide-react";

interface FileUploadProps extends Omit<TextFieldProps, "onChange" | "value"> {
  icon?: LucideIcon;
  iconOne?: LucideIcon;
  iconColor?: string;
  placeholder?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const CustomFileUpload: React.FC<FileUploadProps> = ({
  icon: Icon,
  iconOne: IconOne,
  iconColor = "gray",
  fullWidth = true,
  size = "small",
  placeholder = "Upload File",
  onChange,
  file,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  return (
    <>
      <MuiTextField
        size={size}
        fullWidth={fullWidth}
        value={file?.name || ""}
        onClick={handleClick}
        placeholder={file?.name || placeholder}
        InputProps={{
          readOnly: true,
          sx: {
            fontSize: "14px",
            pr: 2,
            cursor: "pointer",
            "& input::placeholder": {
              color: "text.secondary",
              opacity: 1,
            },
          },
          startAdornment: Icon && (
            <InputAdornment position="start">
              <Icon size={16} style={{ color: iconColor }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" onClick={handleClick}>
                {IconOne ? <IconOne size={16} /> : <Upload size={16} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        {...rest}
      />

      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />
    </>
  );
};

export default CustomFileUpload;
