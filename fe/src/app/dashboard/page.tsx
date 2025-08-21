"use client"
import SendSingleEmail from "@/components/layout/SendSingleEmail";
import CustomButton from "@/components/ui/Button";
import { useGlobalModal } from "@/components/ui/Modal";
import { Stack, Typography } from "@mui/material";
import { PlusIcon } from "lucide-react";

const Dashboard = () => {

  const { showModal } = useGlobalModal();

  return (
    <Stack>
      <Stack>
        <Typography variant="h4" fontWeight={"700"}>
          Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" >
          Overview of your email campaign performance
        </Typography>
      </Stack>
      <Stack direction={"row"} justifyContent={"space-between"} width={"60%"} minWidth={"350px"} gap={4}
        mt={2}>
        <CustomButton
          text="Send Email"
          icon={PlusIcon}
          iconColor="grey"
          onClick={() =>
            showModal(<SendSingleEmail />)
          }
        />
        <CustomButton
          text="Send Bulk Email"
          icon={PlusIcon}
          iconColor="grey"
          onClick={() =>
            // showModal(<AddRecipient type={"add"} setRefresh={setRefresh} />)
            console.log("clicked")
          }
        />
      </Stack>
    </Stack>
  );
};

export default Dashboard;
