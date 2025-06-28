import CustomButton from "@/components/ui/Button";
import { Box, Stack, Typography } from "@mui/material";
import { Mail, PlusIcon, User2 } from "lucide-react";

const Email = () => {
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
          No Email templates yet
        </Typography>
        <Typography
          width={"65%"}
          textAlign="center"
          mt="10px"
          mb="15px"
          variant="subtitle2"
          color="grey"
        >
          Create your first email template to start your campaigns
        </Typography>
        <Box sx={{ width: "auto" }}>
          <CustomButton
            text="Create Your First Template"
            icon={PlusIcon}
            iconColor="grey"
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default Email;
