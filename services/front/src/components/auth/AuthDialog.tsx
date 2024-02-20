import { isDataPersisted, persistData } from "@/common/common";
import { showError } from "@/store/reducers/snackbar";
import { selectPendingSessionDevices } from "@/store/selector";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import React from "react";
import { ZKorumIcon } from "../../ZKorumIcon";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
    closeAuthModal,
    resetPendingSession,
} from "../../store/reducers/session";
import { dataNotPersisted } from "../error/message";
import { GoBackButton } from "../shared/GoBackButton";
import { Authenticate } from "./Authenticate";
import { DeviceLinking } from "./DeviceLinking";
import { OtpVerify } from "./OtpVerify";
import { WelcomePage } from "./WelcomePage";

// TODO: maybe refactor this as routable dialog or something?
export function AuthDialog() {
    const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
    const dispatch = useAppDispatch();
    const pendingSessionStatus = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        return state.sessions.sessions[pendingSessionEmail]?.status;
    });
    const devices = useAppSelector(selectPendingSessionDevices);

    // TODO: prompt users to download the app to home screen
    // force especially iOS people to do so, otherwise this is useless
    // we should detect capabilities we need first, before allowing to add to home screen with that device
    React.useEffect(() => {
        const persistIfNotAlreadyPersisted = async () => {
            const isPersisted = await isDataPersisted();
            if (!isPersisted) {
                await persistData();
            }
        };

        persistIfNotAlreadyPersisted().catch((e) => {
            dispatch(showError(dataNotPersisted));
            console.error(e);
        });
    }, []);

    function handleClose() {
        dispatch(closeAuthModal());
    }

    function getGoBackButton(): JSX.Element | null {
        if (
            pendingSessionStatus === "verifying" ||
            pendingSessionStatus === "awaiting-syncing"
        ) {
            return (
                <GoBackButton onClick={() => dispatch(resetPendingSession())} />
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
                    <Container>
                        {pendingSessionStatus === "verifying" ? (
                            <OtpVerify />
                        ) : pendingSessionStatus === "awaiting-syncing" ? (
                            <DeviceLinking devices={devices} />
                        ) : pendingSessionStatus === "logged-in" ? (
                            <WelcomePage
                                onNextButtonClicked={() => {
                                    dispatch(closeAuthModal());
                                    dispatch(resetPendingSession());
                                }}
                            />
                        ) : (
                            <Authenticate />
                        )}
                    </Container>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
