import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Chip,
} from "@mui/material";
import {
  FileText,
  FileDigit,
  FileCode,
  FileType2,
  Trash2,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSnackbar } from "@/context/SnackbarContext";
import axiosInstance from "@/hooks/axios";

type Attachment = {
  _id: string;
  name: string;
  url?: string;
  isPublic: boolean;
};

const getIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return <FileText size={20} />;
    case "doc":
    case "docx":
      return <FileDigit size={20} />;
    case "xls":
    case "xlsx":
      return <FileCode size={20} />;
    default:
      return <FileType2 size={20} />;
  }
};

const AttachmentList = ({
  attachments,
  setRefresh,
}: {
  attachments: Attachment[];
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { showSnackbar } = useSnackbar();

  const deleteAttachment = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/api/attachment/${id}`);
      if (res.data.message === "deleted successfully") {
        showSnackbar("Attachment deleted", "success");
        setRefresh((prev) => !prev);
      } else {
        showSnackbar(res.data.message || "Delete failed", "error");
      }
    } catch {
      showSnackbar("Error deleting attachment", "error");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      {attachments.map((file) => (
        <Paper
          key={file._id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #eee",
            transition: "0.2s",
            "&:hover": {
              boxShadow: 2,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box>{getIcon("file.name.doc")}</Box>
            <Box sx={{ maxWidth: "100px" }}>
              <Tooltip title={file.name}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                >
                  {file.name}
                </Typography>
              </Tooltip>

              <Chip
                size="small"
                label={file.isPublic ? "Public" : "Private"}
                icon={file.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                color={file.isPublic ? "success" : "default"}
                sx={{ mt: 0.5, fontSize: "0.65rem" }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {file.url && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <Download size={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => deleteAttachment(file._id)}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default AttachmentList;
