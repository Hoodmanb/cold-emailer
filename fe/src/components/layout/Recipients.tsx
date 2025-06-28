import {
  Card,
  CardContent,
  Box,
  Typography,
  Badge,
  Paper,
  Tooltip,
  IconButton,
} from "@mui/material";
import { EllipsisVertical, Mail, User } from "lucide-react";
import CustomDropdownMenu from "../ui/Menu";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { useGlobalModal } from "../ui/Modal";
import AddRecipient from "./AddRecipient";
import { useFetchCategory } from "@/hooks/queryHooks";

type RecipientProp = {
  name: string;
  email: string;
  category: string;
  _id: string;
};

const RecipientList = ({
  recipient,
  setRefresh,
}: {
  recipient: RecipientProp[];
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { showSnackbar } = useSnackbar();
  const { showModal } = useGlobalModal();
  const { categories, refetchCategories } = useFetchCategory("/api/category");

  const transformCategory = (id: string): string => {
    const found = categories.find((item) => item._id === id);
    return found ? found.category : "";
  };

  const deleteRecipient = async (email: string) => {
    try {
      const deleted = await axiosInstance.delete(`/api/recipient/${email}`);
      const res = deleted.data;
      if (deleted.status === 204) {
        showSnackbar("recipient deleted successfully.", "success");
        return setRefresh((prev) => !prev);
      } else {
        showSnackbar(res.message || "error deleting recipient", "error");
      }
    } catch (error) {}
  };
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: "8px",
      }}
    >
      {recipient.map((item) => (
        <Box
          key={item._id}
          sx={{
            width: { xs: "100%", sm: "30%", md: "200px" },
            minWidth: "170px",
          }}
        >
          <Card
            elevation={0}
            sx={{
              border: "1px solid #0F172A1A",
              transition: "box-shadow 0.3s",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "#0F172A1A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={12} color="black" />
                  </Paper>
                  <Box sx={{ maxWidth: "130px" }}>
                    <Tooltip title={item.name}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.75rem",
                        }}
                      >
                        {item.name.slice(0, 10) +
                          (item.name.length > 10 ? "..." : "")}
                      </Typography>
                    </Tooltip>

                    <Tooltip title={item.email}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          left: 12,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Mail size={9} style={{ marginRight: 3 }} />
                        {item.email.slice(0, 10) +
                          (item.email.length > 10 ? "..." : "")}
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>
                <CustomDropdownMenu
                  menuTrigger={
                    <IconButton sx={{ p: "2px" }}>
                      <EllipsisVertical size={"18px"} />
                    </IconButton>
                  }
                  menuItems={[
                    {
                      label: "Update",
                      onClick: () =>
                        showModal(
                          <AddRecipient
                            type={"update"}
                            recipientEmail={item.email}
                            setRefresh={setRefresh}
                          />
                        ),
                    },
                    {
                      label: "Delete",
                      onClick: () => deleteRecipient(item.email),
                    },
                  ]}
                />
              </Box>

              <Badge
                badgeContent={transformCategory(item.category)}
                color="secondary"
                sx={{
                  display: "block",
                  mx: "auto",
                  width: "fit-content",
                  "& .MuiBadge-badge": {
                    top: 8,
                    border: `1px solid`,
                    borderColor: "background.paper",
                    padding: "0 4px",
                    fontSize: "0.6rem",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default RecipientList;
