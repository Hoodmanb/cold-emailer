import { ErrorMessage } from "formik";
import { Typography } from "@mui/material";

interface Props {
  name: string;
}

export const ErrorText: React.FC<Props> = ({ name }) => (
  <ErrorMessage
    name={name}
    render={(msg) => (
      <Typography
        variant="caption"
        color="error"
        sx={{ marginTop: "4px", fontSize: "0.7rem" }}
      >
        {msg}
      </Typography>
    )}
  />
);
