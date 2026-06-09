"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  LayoutDashboard,
  CreditCard,
  Activity,
  Users,
  Menu,
  Cpu,
  Settings,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { getAdminHelp } from "@/components/admin/adminHelpContent";
import type { AdminHelpId } from "@/components/admin/adminHelpContent";

const DRAWER_WIDTH = 240;

const NAV_ITEMS: Array<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  helpId: AdminHelpId;
}> = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard, exact: true, helpId: "nav.overview" },
  { label: "Billing", href: "/dashboard/admin/billing", icon: CreditCard, helpId: "nav.billing" },
  { label: "Models", href: "/dashboard/admin/models", icon: Cpu, helpId: "nav.models" },
  { label: "Usage Logs", href: "/dashboard/admin/usage", icon: Activity, helpId: "nav.usage" },
  { label: "Users", href: "/dashboard/admin/users", icon: Users, helpId: "nav.users" },
  { label: "Communication", href: "/dashboard/admin/communication", icon: Settings, helpId: "nav.communication" },
  { label: "Feedback & Cases", href: "/dashboard/admin/feedback", icon: MessageSquare, helpId: "nav.feedback" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.userProfile);

  if (user && user.role !== "admin") {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Admin access required. Set ADMIN_EMAIL in server env to promote your account.
      </Alert>
    );
  }

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" fontWeight={800}>Admin Console</Typography>
        <Typography variant="caption" color="text.secondary">Platform management</Typography>
      </Box>
      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact, helpId }) => {
          const active = isActive(pathname, href, exact);
          const help = getAdminHelp(helpId);
          return (
            <Tooltip
              key={href}
              title={
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{help.title}</Typography>
                  <Typography variant="caption">{help.description}</Typography>
                </Box>
              }
              placement="right"
              arrow
              enterDelay={400}
            >
              <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: "0.9rem", color: active ? "white" : "text.primary" }}
              />
            </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              position: "relative",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        {isMobile && (
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Open admin menu">
              <Menu size={20} />
            </IconButton>
            <Typography fontWeight={700}>Admin</Typography>
          </Stack>
        )}
        {children}
      </Box>
    </Box>
  );
}
