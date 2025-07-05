import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Collapse,
  Chip,
  Tooltip,
  ListItemButton,
} from "@mui/material";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pen,
  Trash2,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { useSnackbar } from "@/context/SnackbarContext";
import axiosInstance from "@/hooks/axios";
import { useGlobalModal } from "../ui/Modal";
import AddEmailTemplate from "./AddEmailTemplate";

type Template = {
  _id: string;
  name: string;
  subject: string;
  body: string;
  isPublic: boolean;
  url?: string;
};

const TemplateList = ({
  templates,
  setRefresh,
}: {
  templates: Template[];
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { showSnackbar } = useSnackbar();
  const { showModal } = useGlobalModal();

  const toggleOpen = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteTemplate = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/api/template/${id}`);
      if (res.status === 200) {
        showSnackbar("deleted successfully", "success");
        setRefresh((prev) => !prev);
      } else {
        showSnackbar(res.data.message || "Error deleting template", "error");
      }
    } catch {
      showSnackbar("Server error while deleting template", "error");
    }
  };

  return (
    <Box sx={{ maxHeight: "70vh", overflowY: "auto" }}>
      <List>
        {templates.map((template) => {
          const isOpen = openItems[template._id] || false;
          return (
            <Box key={template._id} sx={{ borderBottom: "1px solid #eee" }}>
              <ListItemButton
                onClick={() => toggleOpen(template._id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,

                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {template.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.subject}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Tooltip title={template.isPublic ? "Public" : "Private"}>
                    <Chip
                      size="small"
                      icon={
                        template.isPublic ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )
                      }
                      label={template.isPublic ? "Public" : "Private"}
                      color={template.isPublic ? "success" : "default"}
                    />
                  </Tooltip>

                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Box>
              </ListItemButton>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Body:</strong> {template.body}
                  </Typography>

                  {template.url && (
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "primary.main",
                        wordBreak: "break-all",
                      }}
                    >
                      <Link2 size={14} /> {template.url}
                    </Typography>
                  )}

                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Tooltip title="Edit Template">
                      <IconButton
                        size="small"
                        onClick={() =>
                          showModal(
                            <AddEmailTemplate
                              type="update"
                              templateId={template._id}
                              setRefresh={setRefresh}
                            />
                          )
                        }
                      >
                        <Pen size={16} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Template">
                      <IconButton
                        size="small"
                        onClick={() => deleteTemplate(template._id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
};

export default TemplateList;
