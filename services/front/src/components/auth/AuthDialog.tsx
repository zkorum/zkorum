import CloseIcon from "@mui/icons-material/Close";
import { DialogContent, IconButton } from "@mui/material";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";
import { Outlet } from "react-router-dom";
import { ZKorumIcon } from "../../ZKorumIcon";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { closeModal } from "../../reducers/session";
import { Login } from "./Login";
import { Register } from "./Register";

export function AuthDialog() {
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
