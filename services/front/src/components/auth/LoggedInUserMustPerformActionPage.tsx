import { useAppDispatch } from "@/hooks";
import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { COMMUNITIES, NOTIFICATIONS } from "@/common/navigation";

export interface LoggedInUserMustPerformActionPageProps {
    isTheOnlyDevice: boolean;
    hasFilledForms: boolean;
}

export function LoggedInUserMustPerformActionPage({
    isTheOnlyDevice,
    hasFilledForms,
}: LoggedInUserMustPerformActionPageProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (hasFilledForms && !isTheOnlyDevice) {
            // this component should not have been called on first place! close the form
            dispatch(closeAuthModal());
            dispatch(resetPendingSession());
        }
    }, []);

    function handleOnSync() {
        navigate(NOTIFICATIONS);
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
                alignItems: "left",
            }}
        >
            {isTheOnlyDevice ? (
                <>
                    <Box sx={{ my: 2, alignSelf: "center" }}>
                        <Typography variant={"h6"}>Add a new device</Typography>{" "}
                    </Box>
                    <Box sx={{ my: 2 }}>
                        <Typography component="div">
                            This is the only device connected to your account.{" "}
                            <Box fontWeight="fontWeightMedium" display="inline">
                                If you lose access to this device, uninstall the
                                app or delete its cache,
                            </Box>{" "}
                            you won't be able to change your responses in
                            polls/votes you already registered to, and ZKorum
                            will not be able to tell what posts you created.
                        </Typography>
                    </Box>
                </>
            ) : null}
            {!hasFilledForms ? (
                <>
                    <Box sx={{ my: 2, alignSelf: "center" }}>
                        <Typography variant={"h6"}>Fill the forms</Typography>{" "}
                    </Box>

                    <Box sx={{ my: 2 }}>
                        <Typography>
                            Before using ZKorum, you need to fill forms to
                            connect with your community. Thanks to
                            Zero-Knowledge proofs, the posts you will create
                            cannot trace back to your account or to the forms,
                            yet we can verify they originated from some
                            anonymous invididual in your community.
                        </Typography>
                    </Box>
                </>
            ) : null}
            <Box sx={{ my: 2 }}>
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
                    {!hasFilledForms ? (
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
