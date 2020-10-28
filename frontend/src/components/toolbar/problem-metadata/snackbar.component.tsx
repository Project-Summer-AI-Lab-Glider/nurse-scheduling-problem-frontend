import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

interface SnackbarComponent {
  alertMessage: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SnackbarComponent({ alertMessage, open, setOpen }: SnackbarComponent): JSX.Element {
  function handleClose(event?: React.SyntheticEvent, reason?: string): void {
    if (reason === "clickaway") return;

    setOpen(false);
  }

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <MuiAlert onClose={handleClose} elevation={6} variant="filled" severity="warning">
        {alertMessage}
      </MuiAlert>
    </Snackbar>
  );
}
