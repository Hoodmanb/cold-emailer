"use client";

import React, { useEffect } from "react";
import {
  List,
  ListItemButton,
  useMediaQuery,
  Theme,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
  Typography,
} from "@mui/material";
import {
  LayoutDashboard,
  ChevronDown,
  LogOut,
  ChevronUp,
  ShoppingCart,
  Dot,
  LogIn,
  User2,
  Calendar1,
  Calendar,
  Mail,
  Activity,
  File,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import Modal from "@mui/material/Modal";
import { LucideIcon } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/context/SnackbarContext";

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
        onClick={() => handleSectionSelect(text)}
        sx={{
          ...getActiveStyle(link),
          ...getActiveStyle(link1 || ""),
          ...sectionStyles,
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
  text3,
  text4,
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
}

const SubHeader: React.FC<SubHeaderProps> = ({
  link,
  text,
  text1,
  handleSectionSelect,
  isDrawerOpen,
}) => {
  const pathname = usePathname();
  return (
    <ListItemButton
      component={Link}
      href={link}
      sx={{ pl: 4 }}
      onClick={() => handleSectionSelect(text)}
    >
      {isDrawerOpen && <Typography>{text1}</Typography>}
      {pathname === link && <Dot color="red" size="30px" />}
    </ListItemButton>
  );
};

const Drawer: React.FC<MiniDrawerProps> = ({ children }) => {
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const { showSnackbar } = useSnackbar();

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [open, setOpen] = React.useState(true);
  //   const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsDrawerOpen(false);
  };

  // Toggle section open/close
  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isSmallScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down(650)
  );
  const isBigScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up(650)
  );

  useEffect(() => {
    if (isSmallScreen) {
      setIsDrawerOpen(false);
      setOpen(false);
    }
    if (isBigScreen) {
      setIsDrawerOpen(true);
      setOpen(false);
    }
  }, [isSmallScreen, isBigScreen]);

  // Handle section selection
  const handleSectionSelect = (section: string) => {
    setOpenSection(null);
  };

  // Style for active section
  //   const getActiveStyle = (section: string) => {
  //     return pathname === section
  //       ? {
  //           color: "black",
  //           backgroundColor: "#0E1540",
  //           borderRadius: "15px",
  //           width: "90%",
  //         }
  //       : ""; // Customize active section style
  //   };

  //   const getActiveStyleIcon = (section: string) => {
  //     return pathname === section ? { color: "black" } : "";
  //   };

  const sectionStyles = {
    margin: "15px 0px",
    ml: isDrawerOpen ? "" : "10px",
    paddingLeft: !isDrawerOpen ? "11px" : "15px",
    borderRadius: "15px",
    width: !isDrawerOpen ? "75%" : "100%",
    color: "text.secondary",
  };

  const toggleDrawer = (): void => {
    setIsDrawerOpen(!isDrawerOpen);
    setOpen(!open);
  };

  if (!mounted) return null;

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
          position: "fixed",
          top: 0,
          left: 0,
          width: isDrawerOpen ? "240px" : "70px",
          backgroundColor: "background.paper",
          display: !isDrawerOpen && isSmallScreen ? "none" : "block",
          color: "text.primary",
          height: "100%",
          paddingBottom: "auto",
          padding: isDrawerOpen ? "0px 10px" : "",
          zIndex: 100,
          overflowX: "hidden",
          overflowY: "auto",
          scrollbarWidth: "thin",
          borderRight: "1px solid #0F172A1A",
        }}
      >
        <Box
          sx={{
            display: "flex",
            pt: "20px",
            justifyContent: "center",
            height: "60px",
          }}
        >
          <Box
            sx={{
              position: "relative",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                fontSize: !isDrawerOpen ? "1em" : "1.5em",
              }}
            >
              {!isDrawerOpen ? "Mailer" : " Cold Mailer"}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            height: "90%",
          }}
        >
          <List>
            <LinkHeader
              text="dashboard"
              text1="Dashboard"
              icon={LayoutDashboard}
              link="/dashboard"
              handleSectionSelect={handleSectionSelect}
              sectionStyles={sectionStyles}
              isDrawerOpen={isDrawerOpen}
            />

            <LinkHeader
              text="recipients"
              text1="Recipients"
              icon={User2}
              link="/dashboard/recipients"
              handleSectionSelect={handleSectionSelect}
              sectionStyles={sectionStyles}
              isDrawerOpen={isDrawerOpen}
            />

            <LinkWithSubHeader
              text="schedules"
              text0="Schedules"
              text1="/dashboard/schedules/scheduler"
              icon={Calendar}
              text2="/dashboard/schedules/history"
              sectionStyles={sectionStyles}
              toggleSection={toggleSection}
              isDrawerOpen={isDrawerOpen}
              openSection={openSection}
              SubHeader1={
                <SubHeader
                  link="/dashboard/schedules/scheduler"
                  text="scheduler"
                  text1="Scheduler"
                  handleSectionSelect={handleSectionSelect}
                  isDrawerOpen={isDrawerOpen}
                />
              }
              SubHeader2={
                <SubHeader
                  link="/dashboard/schedules/history"
                  text="schedulesHistory"
                  text1="History"
                  handleSectionSelect={handleSectionSelect}
                  isDrawerOpen={isDrawerOpen}
                />
              }
            />

            <LinkHeader
              text="templates"
              text1="Templates"
              icon={File}
              link="/dashboard/templates"
              handleSectionSelect={handleSectionSelect}
              sectionStyles={sectionStyles}
              isDrawerOpen={isDrawerOpen}
            />

            <LinkHeader
              text="activities"
              text1="Activities"
              icon={Activity}
              link="/dashboard/activities"
              handleSectionSelect={handleSectionSelect}
              sectionStyles={sectionStyles}
              isDrawerOpen={isDrawerOpen}
            />
          </List>
          <Box
            sx={{
              display: "flex",
              alignItems: "end",
              height: "auto",
            }}
          >
            <Divider />

            {user ? (
              <ListItemButton
                onClick={async () => {
                  const logout = await clearUser();
                  if (logout === "successfully logged out") {
                    showSnackbar("successfully logged out", "success");
                  }
                  showSnackbar("errror logging out", "error");
                }}
                sx={{
                  ...sectionStyles,
                  border: isDrawerOpen ? "1px solid grey" : "",
                }}
              >
                <ListItemIcon>
                  <LogOut size={"1.2em"} color="black" />
                </ListItemIcon>
                {isDrawerOpen && (
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
                  router.push("/auth/login");
                }}
                sx={{
                  ...sectionStyles,
                  border: isDrawerOpen ? "1px solid grey" : "",
                  width: "100%",
                }}
              >
                <ListItemIcon>
                  <LogIn size={"1.2em"} color="black" />
                </ListItemIcon>
                {isDrawerOpen && (
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
        </Box>
        {/* </Link> */}
      </Box>

      {isSmallScreen && (
        <Modal sx={{ zIndex: 90 }} open={open} onClose={handleClose}>
          <div></div>
        </Modal>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isDrawerOpen && !isSmallScreen ? `calc(100% - 240px)` : "100%",
          marginLeft:
            isDrawerOpen && !isSmallScreen
              ? "240px"
              : isSmallScreen
              ? "0"
              : "70px",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {/* TopBar */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left:
              isDrawerOpen && isBigScreen
                ? "240px"
                : isSmallScreen
                ? "0"
                : "70px",
            width:
              isDrawerOpen && !isSmallScreen
                ? `calc(100% - 240px)`
                : !isDrawerOpen && !isSmallScreen
                ? `calc(100% - 70px)`
                : "100%",
            height: "70px",
            backgroundColor: "white",
            zIndex: 90,
            transition: "left 0.3s ease-in-out, width 0.3s ease-in-out",
          }}
        >
          <TopBar toggleDrawer={toggleDrawer} isDrawerOpen={isDrawerOpen} />
        </Box>

        {/* Content */}
        <Box
          sx={{
            // backgroundColor: "#0F172A1A",
            flexGrow: 1,
            padding: "20px",
            width: "100%",
            marginTop: "60px",
            height: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Drawer;
