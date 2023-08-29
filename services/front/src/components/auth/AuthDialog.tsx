import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import { Outlet } from "react-router-dom";
import { ZKorumIcon } from "../../ZKorumIcon";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
    closeAuthModal,
    resetPendingSession,
} from "../../store/reducers/session";
import { Authenticate } from "./Authenticate";
import { OtpVerify } from "./OtpVerify";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

export function AuthDialog() {
    const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
    const dispatch = useAppDispatch();
    const pendingSession = useAppSelector((state) => {
        const pendingSessionUserId = state.sessions.pendingSessionEmail;
        return state.sessions.sessions[pendingSessionUserId];
    });

    function handleClose() {
        dispatch(closeAuthModal());
    }

    function getGoBackButton(): JSX.Element | null {
        if (pendingSession?.status === "verifying") {
            return (
                <IconButton
                    aria-label="close"
                    onClick={() => dispatch(resetPendingSession())}
                    sx={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <KeyboardBackspaceIcon />
                </IconButton>
            );
        } else {
            return null;
        }
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
                            <Grid
                                container
                                direction="column"
                                alignItems="center"
                            >
                                <Grid>
                                    <ZKorumIcon iconBackgroundColor={"dark"} />
                                </Grid>
                                <Grid>
                                    <Typography variant="body2">
                                        Closed Alpha
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {getGoBackButton()}
                </DialogTitle>
                <DialogContent>
                    {pendingSession?.status === "verifying" ? (
                        <OtpVerify />
                    ) : (
                        <Authenticate />
                    )}
                </DialogContent>
            </Dialog>
            <Outlet />
        </Box>
    );
}
