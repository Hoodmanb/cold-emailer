import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { SnackbarCloseReason } from "@mui/material/Snackbar";

interface SnackParams {
  open: boolean;
  text: string;
  state: "success" | "error" | "warning" | "info";
  onClose?: () => void;
}

export default function CustomizedSnackbars({
  open,
  text,
  state,
  onClose,
}: SnackParams) {
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") return;
    onClose?.();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity={state}
        variant="filled"
        sx={{ width: "auto" }}
      >
        {text}
      </Alert>
    </Snackbar>
  );
}
