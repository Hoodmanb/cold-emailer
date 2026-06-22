"use client";

import React, { useEffect } from "react";
import {
  List,
  ListItemButton,
  useMediaQuery,
  ListItemIcon,
  Collapse,
  Box,
  Divider,
  Typography,
  Drawer as MuiDrawer,
  useTheme,
  Stack,
} from "@mui/material";
import {
  LayoutDashboard,
  ChevronDown,
  LogOut,
  ChevronUp,
  Dot,
  LogIn,
  User2,
  Calendar,
  Activity,
  File,
  Settings,
  FileText,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import { LucideIcon } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/context/SnackbarContext";
import { useAuth } from "@/context/AuthProvider";

interface MiniDrawerProps {
  children: React.ReactNode;
}

interface LinksProps {
  text: string;
  text1: string;
  icon: LucideIcon;
  link: string;
  link1?: string;
  handleSectionSelect: (t: string) => void;
  sectionStyles: React.CSSProperties;
  isDrawerOpen: boolean;
  onNavClick?: () => void;
}

const LinkHeader: React.FC<LinksProps> = ({
  text,
  text1,
  icon: Icon,
  link,
  link1,
  handleSectionSelect,
  sectionStyles,
  isDrawerOpen,
  onNavClick,
}) => {
  const pathname = usePathname();
  const getActiveStyle = (section: string) => {
    return pathname === section
      ? {
        color: "black",
        backgroundColor: "#0F172A1A",
        borderRadius: "10px",
        width: "90%",
      }
      : "";
  };

  const getActiveStyleIcon = (section: string) => {
    return pathname === section ? { color: "black" } : "";
  };

  return (
    <Link href={link}>
      <ListItemButton
        onClick={() => {
          handleSectionSelect(text);
          onNavClick?.();
        }}
        sx={{
          ...getActiveStyle(link),
          ...getActiveStyle(link1 || ""),
          ...sectionStyles,
          minHeight: 48,
        }}
      >
        <ListItemIcon>
          <Icon
            style={{
              color: "grey",
              ...getActiveStyleIcon(link),
              ...getActiveStyleIcon(link1 || ""),
            }}
          />
        </ListItemIcon>
        {isDrawerOpen && (
          <Typography color={pathname === link ? "black" : ""}>
            {text1}
          </Typography>
        )}
      </ListItemButton>
    </Link>
  );
};

interface LinkWithSubHeaderProps {
  text: string;
  text0: string;
  text1: string;
  text2: string;
  text3?: string;
  text4?: string;
  icon: LucideIcon | React.FC;
  sectionStyles: React.CSSProperties;
  toggleSection: (t: string) => void;
  isDrawerOpen: boolean;
  openSection: string | null;
  SubHeader1: React.ReactElement;
  SubHeader2: React.ReactElement;
}

const LinkWithSubHeader: React.FC<LinkWithSubHeaderProps> = ({
  text,
  text0,
  text1,
  text2,
  icon: Icon,
  sectionStyles,
  toggleSection,
  isDrawerOpen,
  openSection,
  SubHeader1,
  SubHeader2,
}) => {
  const pathname = usePathname();
  const getActiveStyle = (section: string) => {
    return pathname === section
      ? {
        fontWeight: "bold",
        backgroundColor: "#0F172A1A",
      }
      : "";
  };

  const getActiveStyleIcon = (section: string) => {
    return pathname === section ? { color: "black" } : "";
  };

  return (
    <>
      <ListItemButton
        onClick={() => toggleSection(text)}
        sx={{
          ...getActiveStyle(text1),
          ...getActiveStyle(text2),
          ...sectionStyles,
        }}
      >
        <ListItemIcon>
          <Icon
            style={{
              color: "grey",
              ...getActiveStyleIcon(text1),
              ...getActiveStyleIcon(text2),
            }}
          />
        </ListItemIcon>
        {isDrawerOpen && (
          <Typography
            color={pathname === text1 || pathname === text2 ? "black" : ""}
            mr={2}
          >
            {text0}
          </Typography>
        )}
        {openSection === text ? (
          <ChevronUp
            color={pathname === text1 || pathname === text2 ? "black" : "grey"}
          />
        ) : (
          <ChevronDown
            color={pathname === text1 || pathname === text2 ? "black" : "grey"}
          />
        )}
      </ListItemButton>

      <Collapse in={openSection === text} timeout="auto" unmountOnExit>
        <List
          sx={{
            m: 0,
            p: 0,
            width: "83%",
            float: "right",
            display: "inline-flex",
            fontSize: "0.6em",
          }}
        >
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            sx={{
              width: "2px",
              backgroundColor:
                pathname === text1 || pathname === text2 ? "grey" : "#FFFFFF66",
              ml: "-10px",
            }}
          />
          <Box>
            <Typography
              component="span"
              fontSize={"0.5em"}
              color={pathname === text1 ? "black" : "grey"}
            >
              {SubHeader1}
            </Typography>
            <Typography
              component="span"
              fontSize={"0.5em"}
              color={pathname === text2 ? "black" : "grey"}
            >
              {SubHeader2}
            </Typography>
          </Box>
        </List>
      </Collapse>
    </>
  );
};

interface SubHeaderProps {
  link: string;
  text: string;
  text1: string;
  handleSectionSelect: (t: string) => void;
  isDrawerOpen: boolean;
  onNavClick?: () => void;
}

const SubHeader: React.FC<SubHeaderProps> = ({
  link,
  text,
  text1,
  handleSectionSelect,
  isDrawerOpen,
  onNavClick,
}) => {
  const pathname = usePathname();
  return (
    <ListItemButton
      component={Link}
      href={link}
      sx={{ pl: 4, minHeight: 48 }}
      onClick={() => {
        handleSectionSelect(text);
        onNavClick?.();
      }}
    >
      {isDrawerOpen && <Typography>{text1}</Typography>}
      {pathname === link && <Dot color="red" size="30px" />}
    </ListItemButton>
  );
};

const Drawer: React.FC<MiniDrawerProps> = ({ children }) => {
  const theme = useTheme();
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user?.name);
  const userRole = useAuthStore((state) => state.user?.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { showSnackbar } = useSnackbar();
  const auth = useAuth() as any;
  const authUser = auth?.user;
  const logout = auth?.logout;

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    if (isMobile) {
      setIsDrawerOpen(false);
      setMobileNavOpen(false);
    } else {
      setIsDrawerOpen(true);
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleSectionSelect = (section: string) => {
    setOpenSection(null);
  };

  const sectionStyles = {
    margin: "15px 0px",
    ml: isDrawerOpen ? "" : "10px",
    paddingLeft: !isDrawerOpen ? "11px" : "15px",
    borderRadius: "15px",
    width: !isDrawerOpen ? "75%" : "100%",
    color: "text.secondary",
    minHeight: 48,
  };

  const sectionStylesExpanded = {
    margin: "15px 0px",
    ml: "",
    paddingLeft: "15px",
    borderRadius: "15px",
    width: "100%",
    color: "text.secondary",
    minHeight: 48,
  };

  const toggleDrawer = (): void => {
    if (isMobile) {
      setMobileNavOpen((v) => !v);
    } else {
      setIsDrawerOpen((v) => !v);
    }
  };

  const navigationList = (
    labelsVisible: boolean,
    styles: React.CSSProperties,
    dismiss?: () => void,
  ) => (
    <>
      <List sx={{ py: 0 }}>
        <LinkHeader
          text="dashboard"
          text1="Dashboard"
          icon={LayoutDashboard}
          link="/dashboard"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="jobs"
          text1="Jobs & ATS"
          icon={Activity}
          link="/dashboard/jobs"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="documents"
          text1="My Documents"
          icon={FileText}
          link="/dashboard/documents"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="profile"
          text1="Career Profile"
          icon={User2}
          link="/dashboard/profile"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="emailHistory"
          text1="Email History"
          icon={File}
          link="/dashboard/email/history"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkWithSubHeader
          text="schedules"
          text0="Schedules"
          text1="/dashboard/schedules/scheduler"
          icon={Calendar}
          text2="/dashboard/schedules/history"
          sectionStyles={styles}
          toggleSection={toggleSection}
          isDrawerOpen={labelsVisible}
          openSection={openSection}
          SubHeader1={
            <SubHeader
              link="/dashboard/schedules/scheduler"
              text="scheduler"
              text1="Scheduler"
              handleSectionSelect={handleSectionSelect}
              isDrawerOpen={labelsVisible}
              onNavClick={dismiss}
            />
          }
          SubHeader2={
            <SubHeader
              link="/dashboard/schedules/history"
              text="schedulesHistory"
              text1="History"
              handleSectionSelect={handleSectionSelect}
              isDrawerOpen={labelsVisible}
              onNavClick={dismiss}
            />
          }
        />

        <LinkHeader
          text="recipients"
          text1="Recipients"
          icon={User2}
          link="/dashboard/recipients"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="templates"
          text1="Templates"
          icon={File}
          link="/dashboard/templates"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="billing"
          text1="Billing"
          icon={FileText}
          link="/dashboard/billing"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="settings"
          text1="Settings"
          icon={Settings}
          link="/dashboard/settings"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="smtp"
          text1="SMTP Configs"
          icon={Settings}
          link="/dashboard/smtp-configurations"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        <LinkHeader
          text="audit"
          text1="Audit Log"
          icon={Activity}
          link="/dashboard/audit"
          handleSectionSelect={handleSectionSelect}
          sectionStyles={styles}
          isDrawerOpen={labelsVisible}
          onNavClick={dismiss}
        />

        {userRole === "admin" && (
          <LinkHeader
            text="admin"
            text1="Admin"
            icon={Settings}
            link="/dashboard/admin"
            handleSectionSelect={handleSectionSelect}
            sectionStyles={styles}
            isDrawerOpen={labelsVisible}
            onNavClick={dismiss}
          />
        )}
      </List>
      <Box
        sx={{
          display: "flex",
          alignItems: "end",
          height: "auto",
        }}
      >
        <Divider />

        {authUser || user ? (
          <ListItemButton
            onClick={async () => {
              dismiss?.();
              if (typeof clearAuth === "function") clearAuth();
              if (typeof logout === "function") logout();
              showSnackbar("successfully logged out", "success");
            }}
            sx={{
              ...styles,
              border: labelsVisible ? "1px solid grey" : "",
            }}
          >
            <ListItemIcon>
              <LogOut size={"1.2em"} color="black" />
            </ListItemIcon>
            {labelsVisible && (
              <Typography
                sx={{
                  color: "black",
                  fontSize: "0.8em",
                }}
              >
                Sign Out
              </Typography>
            )}
          </ListItemButton>
        ) : (
          <ListItemButton
            onClick={() => {
              dismiss?.();
              router.push("/login");
            }}
            sx={{
              ...styles,
              border: labelsVisible ? "1px solid grey" : "",
              width: "100%",
            }}
          >
            <ListItemIcon>
              <LogIn size={"1.2em"} color="black" />
            </ListItemIcon>
            {labelsVisible && (
              <Typography
                sx={{
                  color: "black",
                  fontSize: "0.8em",
                }}
              >
                Sign In
              </Typography>
            )}
          </ListItemButton>
        )}
      </Box>
    </>
  );

  const sidebarHeader = (compact: boolean) => (
    <Box
      sx={{
        display: "flex",
        pt: compact ? "30px" : "20px",
        justifyContent: "center",
        height: "70px",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Typography
          component="a"
          href="/"
          variant="h5"
          fontWeight={700}
          sx={{
            fontSize: compact ? "1em" : "1.5em",
          }}
        >
          {compact ? (
            "Mailer"
          ) : (
            <Stack direction="row" alignItems={"center"} gap="5px">
              <MailIcon size="38px" color="#3b82f6" /> Cold Mailer
            </Stack>
          )}
        </Typography>
      </Box>
    </Box>
  );

  if (!mounted) return null;

  const contentShift =
    isDesktop && isDrawerOpen ? "240px" : isDesktop ? "70px" : "0";
  const contentWidth =
    isDesktop && isDrawerOpen
      ? `calc(100% - 240px)`
      : isDesktop && !isDrawerOpen
        ? `calc(100% - 70px)`
        : "100%";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "fixed",
          top: 0,
          left: 0,
          width: isDrawerOpen ? "240px" : "70px",
          backgroundColor: "background.paper",
          color: "text.primary",
          height: "100%",
          paddingBottom: "auto",
          padding: isDrawerOpen ? "0px 10px" : "",
          zIndex: theme.zIndex.drawer + 1,
          overflowX: "hidden",
          overflowY: "auto",
          scrollbarWidth: "thin",
          borderRight: "1px solid #0F172A1A",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {sidebarHeader(!isDrawerOpen)}
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            minHeight: "calc(100% - 80px)",
          }}
        >
          {navigationList(isDrawerOpen, sectionStyles)}
        </Box>
      </Box>

      <MuiDrawer
        anchor="left"
        open={mobileNavOpen}
        onClose={closeMobileNav}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: {
            width: 288,
            boxSizing: "border-box",
            borderRight: "1px solid #0F172A1A",
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {sidebarHeader(false)}
          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "column",
              flex: 1,
              overflowY: "auto",
              px: "20px",
            }}
          >
            {navigationList(true, sectionStylesExpanded, closeMobileNav)}
          </Box>
        </Box>
      </MuiDrawer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: contentWidth,
          marginLeft: contentShift,
          overflowX: "hidden",
          overflowY: "auto",
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: contentShift,
            width: contentWidth,
            height: "70px",
            backgroundColor: "background.paper",
            zIndex: theme.zIndex.appBar,
            transition: theme.transitions.create(["left", "width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            borderBottom: "1px solid #0F172A1A",
          }}
        >
          <TopBar
            toggleDrawer={toggleDrawer}
            isDrawerOpen={isDrawerOpen}
            isMobile={isMobile}
          />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 2, md: 2.5 },
            width: "100%",
            maxWidth: "100%",
            marginTop: "70px",
            minHeight: "calc(100vh - 70px)",
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Drawer;
