"use client";

import React from "react";
import { Avatar, Box, IconButton, Stack, Typography, Tooltip } from "@mui/material";
import { MenuIcon, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import BillingStatusChip from "@/components/billing/BillingStatusChip";

interface TopBarProps {
  toggleDrawer: () => void;
  isDrawerOpen: boolean;
  isMobile?: boolean;
}

export default function TopBar({ toggleDrawer, isDrawerOpen, isMobile }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const name = useAuthStore((state) => state.userProfile?.name);
  const user = useAuthStore((state) => state.userProfile?.name);

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
      case "/dashboard/smtp-configurations":
        return "SMTP Configs";
      case "/dashboard/audit":
        return "Audit Log";
      case "/dashboard/billing":
        return "Billing";
      case "/dashboard/admin":
        return "Admin";
      case "/dashboard/admin/billing":
        return "Admin · Billing";
      case "/dashboard/admin/models":
        return "Admin · Models";
      case "/dashboard/admin/usage":
        return "Admin · Usage";
      case "/dashboard/admin/users":
        return "Admin · Users";
      case "/dashboard/admin/communication":
        return "Admin · Communication";
      case "/dashboard/admin/feedback":
        return "Admin · Feedback";
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
        pr: "15px",
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

        {(isMobile || !isDrawerOpen) && (
          <Typography fontWeight={500} fontSize={{ xs: "1rem", sm: "1.2em" }} noWrap component="span">
            {retrivePathName()}
          </Typography>
        )}
      </Box>
      {user && (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BillingStatusChip />
          <Tooltip title={name} arrow placement="bottom-end">
          <Box
            onClick={() => router.push("/dashboard/profile")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: "24px",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                display: { xs: "none", sm: "block" },
                color: "text.primary",
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </Typography>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: "0.95rem",
                fontWeight: 700,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {name?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Tooltip>
        </Stack>
      )}
    </Stack>
  );
}
