import { useAppDispatch } from "@/hooks";
import type { FormsStatus } from "./LoggedInPage";
import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { COMMUNITIES, SETTINGS } from "@/common/navigation";

export interface LoggedInUserMustPerformActionPageProps {
    isTheOnlyDevice: boolean;
    formsStatus: FormsStatus;
}

export function LoggedInUserMustPerformActionPage({
    isTheOnlyDevice,
    formsStatus,
}: LoggedInUserMustPerformActionPageProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (
            formsStatus.hasFilledForms &&
            formsStatus.hasActiveCredential &&
            !isTheOnlyDevice
        ) {
            // this component should not have been called on first place! close the form
            dispatch(closeAuthModal());
            dispatch(resetPendingSession());
        }
    }, []);

    function handleOnSync() {
        navigate(SETTINGS);
        dispatch(closeAuthModal());
        dispatch(resetPendingSession());
    }

    function handleOnSkip() {
        dispatch(closeAuthModal());
        dispatch(resetPendingSession());
    }

    function handleOnForms() {
        navigate(COMMUNITIES);
        dispatch(closeAuthModal());
        dispatch(resetPendingSession());
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Box sx={{ my: 3 }}>
                <Typography variant={"h4"}>Actions needed</Typography>{" "}
            </Box>
            {isTheOnlyDevice ? (
                <Box sx={{ my: 3 }}>
                    <Typography>
                        ZKorum securely generates secret values and keys
                        directly in your browser. Those are responsible for your
                        privacy. ZKorum's server never has access to them.
                    </Typography>
                    <Typography>
                        This is the only device connected to your account.
                        Without syncing another device, if you lose access to
                        this device, the secrets will be lost. As a consequence
                        you won't be allowed to change your responses in
                        polls/votes you already registered to, and ZKorum will
                        not be able to tell what posts you created.
                    </Typography>
                </Box>
            ) : null}
            {!formsStatus.hasFilledForms || !formsStatus.hasActiveCredential ? (
                <Box sx={{ my: 3 }}>
                    <Typography>
                        Before using ZKorum, you need to fill forms so that
                        ZKorum will issue you a Verifiable Credential. ZKorum
                        and anyone from your community can see what you
                        responded, but nobody else can. The posts you will
                        create using the Credential are completely anonymous and
                        cannot trace back to your identity.
                    </Typography>
                </Box>
            ) : null}
            <Box sx={{ my: 3 }}>
                <Grid
                    container
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                >
                    {isTheOnlyDevice ? (
                        <Grid>
                            <Button onClick={handleOnSync} variant="contained">
                                Sync new device
                            </Button>
                        </Grid>
                    ) : null}
                    {!formsStatus.hasFilledForms ||
                    !formsStatus.hasActiveCredential ? (
                        <Grid>
                            <Button onClick={handleOnForms} variant="contained">
                                Fill forms
                            </Button>
                        </Grid>
                    ) : null}
                    <Grid>
                        <Button onClick={handleOnSkip} variant="outlined">
                            Skip for now
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
