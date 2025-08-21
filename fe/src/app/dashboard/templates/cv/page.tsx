import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography } from "@mui/material";
import { Mail, PlusIcon, User2 } from "lucide-react";

const Cv = () => {
  return (
    <Stack>
      <Stack
        sx={{
          flexDirection: "column",
          alignItems: "center",
          p: "70px 0px",
          border: "1px solid #0F172A1A",
          borderRadius: "20px",
        }}
      >
        <Mail size="3em" color="grey" />
        <Typography mt="10px" variant="h6" fontWeight={600}>
          No CV templates yet
        </Typography>
        <Typography
          width={"65%"}
          textAlign="center"
          mt="10px"
          mb="15px"
          variant="subtitle2"
          color="grey"
        >
          Upload your CV/Resume templates to include them in your email
          campaigns
        </Typography>
        <Box sx={{ width: "auto" }}>
          <CustomButton
            text="Upload Your First Cv Template"
            icon={PlusIcon}
            iconColor="grey"
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default Cv;
