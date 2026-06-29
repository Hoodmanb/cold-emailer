"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { getRandomColor } from "@/utils/generateRandomColor";
import { badgeVariants } from "@/motion/variants";

interface CustomBadgeProps {
  text: string;
  bgColor?: string;
  icon?: any;
}

const CustomBadge = ({ text, bgColor, icon }: CustomBadgeProps) => {
  return (
    <motion.div
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "inline-flex" }}
    >
      <Box
        sx={{
          backgroundColor: bgColor || getRandomColor(),
          color: "black",
          px: 1.5,
          py: 0.5,
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          fontSize: "0.75rem",
          fontWeight: "bold",
        }}
      >
        <Typography component="span">{text}</Typography>
        {icon}
      </Box>
    </motion.div>
  );
};

export default CustomBadge;
