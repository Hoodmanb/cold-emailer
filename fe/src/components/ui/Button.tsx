"use client";

import React from "react";
import { Button } from "@mui/material";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { buttonVariants } from "@/motion/variants";

interface CustomButtonProps {
  icon?: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  bgColor?: string;
  type?: "button" | "submit" | "reset";
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  text: string;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  text,
  icon: Icon,
  type = "submit",
  variant = "contained",
  iconColor = "gray",
  bgColor = "#0F172A",
  size = "small",
  onClick,
  disabled,
  ...rest
}) => {
  return (
    <motion.div
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      style={{ width: "100%" }}
    >
      <Button
        disabled={disabled}
        fullWidth
        variant={variant}
        type={type}
        onClick={onClick}
        size={size}
        sx={{
          backgroundColor: variant === "contained" ? bgColor : undefined,
          "&:hover": {
            backgroundColor: variant === "contained" ? bgColor : undefined,
            opacity: variant === "contained" ? 0.9 : undefined,
          },
          color: variant === "contained" ? "#fff" : undefined,
          textTransform: "none",
          transition: "background-color 0.2s, opacity 0.2s",
        }}
        {...rest}
      >
        {Icon && <Icon size={18} color={iconColor} style={{ marginRight: 6 }} />}
        {text}
      </Button>
    </motion.div>
  );
};

export default CustomButton;
