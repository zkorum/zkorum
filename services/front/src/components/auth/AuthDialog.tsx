import CloseIcon from "@mui/icons-material/Close";
import { DialogContent, IconButton } from "@mui/material";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { Outlet } from "react-router-dom";
import { ZKorumIcon } from "../../ZKorumIcon";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { closeModal } from "../../reducers/session";
import { Authenticate } from "./Authenticate";

export function AuthDialog() {
  const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
  const dispatch = useAppDispatch();

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
          <Authenticate />
        </DialogContent>
      </Dialog>
      <Outlet />
    </Box>
  );
}
