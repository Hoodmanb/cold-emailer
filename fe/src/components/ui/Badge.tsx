import { Box, Typography } from "@mui/material";
import { getRandomColor } from "@/utils/generateRandomColor";

interface CustomBadgeProps {
  text: string;
  bgColor?: string;
  icon?: any;
}

const CustomBadge = ({ text, bgColor, icon }: CustomBadgeProps) => {
  return (
    <Box
      sx={{
        backgroundColor: bgColor || getRandomColor(),
        color: "black",
        px: 1.5,
        py: 0.5,
        borderRadius: "20px",
        display: "flex",
        fontSize: "0.75rem",
        fontWeight: "bold",
      }}
    >
      <Typography component="span">{text}</Typography>
      {icon}
    </Box>
  );
};

export default CustomBadge;
