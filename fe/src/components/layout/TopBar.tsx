"use client";
import React from "react";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { MenuIcon, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

interface TopBarProps {
  toggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export default function TopBar({ toggleDrawer, isDrawerOpen }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const name = useAuthStore((state) => state.userData?.name);
  const user = useAuthStore((state) => state.user);

  const retrivePathName = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
        break;
      case "/dashboard/recipients":
        return "Recipients";
        break;
      case "/dashboard/schedules/scheduler":
        return "Scheduler";
        break;
      case "/dashboard/schedules/history":
        return "Schedules History";
        break;
      case "/dashboard/templates/email":
        return "Email Templates";
        break;
      case "/dashboard/templates/cv":
        return "Cv Templates";
        break;
      case "/dashboard/activities":
        return "Activities";
        break;
      case "/dashboard/profile":
        return "Profile";
        break;
      default:
        break;
    }
  };

  return (
    <Stack
      direction={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
      sx={{
        width: "100%",
        pr: "5px",
        pl: "0px",
        height: "60px",
        zIndex: "100",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 5,
          paddingLeft: "10px",
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <MenuIcon />
        </IconButton>

        {!isDrawerOpen && (
          <Typography fontWeight={500} fontSize={"1.2em"}>
            {retrivePathName()}
          </Typography>
        )}
      </Box>
      {user && (
        <IconButton onClick={() => router.push("/dashboard/profile")}>
          <Avatar sx={{ width: 35, height: 35, color: "black" }}>
            {name?.charAt(0)}
          </Avatar>
        </IconButton>
      )}
    </Stack>
  );
}
