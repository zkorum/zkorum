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
import { LoggedInPage, type FormsStatus } from "./LoggedInPage";
import Container from "@mui/material/Container";

// TODO: maybe refactor this as routable dialog or something?
export function AuthDialog() {
    const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
    const dispatch = useAppDispatch();
    const pendingSessionStatus = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        return state.sessions.sessions[pendingSessionEmail]?.status;
    });
    const isRegistration = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        return state.sessions.sessions[pendingSessionEmail]?.isRegistration;
    });
    const isTheOnlyDevice = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        const syncingDevices = state.sessions.sessions[pendingSessionEmail]
            ?.syncingDevices as string[]; // at this point it cannot be undefined => TODO improve this
        if (syncingDevices === undefined) {
            return undefined;
        }
        return syncingDevices.length === 1;
    });
    const formsStatus = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        const emailCredentialsPerEmail =
            state.sessions.sessions[pendingSessionEmail]
                ?.emailCredentialsPerEmail;
        if (emailCredentialsPerEmail === undefined) {
            return undefined;
        }
        return {
            hasFilledForms: pendingSessionEmail in emailCredentialsPerEmail,
            hasActiveCredential:
                pendingSessionEmail in emailCredentialsPerEmail &&
                emailCredentialsPerEmail[pendingSessionEmail].active !==
                    undefined,
        };
    });

    function handleClose() {
        dispatch(closeAuthModal());
    }

    function getGoBackButton(): JSX.Element | null {
        if (pendingSessionStatus === "verifying") {
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
                    {pendingSessionStatus !== "logged-in" ? (
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
                    ) : null}
                    {getGoBackButton()}
                </DialogTitle>
                <DialogContent>
                    <Container>
                        {pendingSessionStatus === "verifying" ? (
                            <OtpVerify />
                        ) : pendingSessionStatus === "logged-in" &&
                          (isRegistration ||
                              isTheOnlyDevice ||
                              !formsStatus?.hasFilledForms ||
                              !formsStatus?.hasActiveCredential) ? (
                            <LoggedInPage
                                isRegistration={isRegistration as boolean}
                                isTheOnlyDevice={isTheOnlyDevice as boolean}
                                formsStatus={formsStatus as FormsStatus}
                            /> // when status is logged-in, there must be data in these fields - TODO: provide better error-handling later (notably via better typing and by being careful when loading from fresh local DB)
                        ) : (
                            <Authenticate />
                        )}
                    </Container>
                </DialogContent>
            </Dialog>
            <Outlet />
        </Box>
    );
}
