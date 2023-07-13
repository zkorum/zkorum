import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "../../hooks";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {
  DialogContent,
  IconButton,
  Input,
  TextField,
  Typography,
} from "@mui/material";
import { closeModal } from "../../reducers/session";
import { useAppDispatch } from "../../hooks";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import { ZKorumIcon } from "../../ZKorumIcon";
import React from "react";
import { Login } from "./Login";
import { Register } from "./Register";

interface AuthDialogProps {
  defaultIsRegisterDialog: boolean;
}

export function AuthDialog(
  props: AuthDialogProps = { defaultIsRegisterDialog: false }
) {
  const { defaultIsRegisterDialog } = props;
  const [isRegisterDialog, setIsRegisterDialog] = React.useState<
    boolean | undefined
  >(undefined);
  const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
  const dispatch = useAppDispatch();

  function handleSignup() {
    setIsRegisterDialog(true);
  }

  function handleLogin() {
    setIsRegisterDialog(false);
  }

  function handleClose() {
    dispatch(closeModal());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
      password: data.get("password"),
    });
  }

  return (
    <Box>
      <Dialog fullScreen open={isModalOpen} onClose={handleClose}>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box>
              <ZKorumIcon iconBackgroundColor={"dark"} />
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isRegisterDialog ? (
            <Register handleLogin={handleLogin} />
          ) : (
            <Login handleRegister={handleSignup} />
          )}
        </DialogContent>
      </Dialog>
      <Outlet />
    </Box>
  );
}
