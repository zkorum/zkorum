import { useAppDispatch } from "@/hooks";
import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { COMMUNITIES, SETTINGS } from "@/common/navigation";

export interface LoggedInUserMustPerformActionPageBakProps {
    isTheOnlyDevice: boolean;
    hasFilledForms: boolean;
}

export function LoggedInUserMustPerformActionPageBak({
    isTheOnlyDevice,
    hasFilledForms,
}: LoggedInUserMustPerformActionPageBakProps) {
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
            <Box sx={{ my: 2 }}>
                <Typography variant={"h6"}>Use Tor via Orbot</Typography>{" "}
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography component="div">
                    ZKorum provides application-level privacy. To protect your
                    IP address and other metadata from revealing your identity,
                    use the Orbot application.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography variant={"h6"}>
                    Do NOT clear ZKorum cache
                </Typography>{" "}
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography component="div">
                    ZKorum securely generates secret values and keys directly in
                    your browser. Those are responsible for your privacy.
                    ZKorum's server never has access to them. ZKorum
                    automatically encrypts and synchronizes your secrets between
                    your connected devices.{" "}
                    <Box fontWeight="fontWeightMedium" display="inline">
                        {" "}
                        Do not delete ZKorum cache, as it would wipe out the
                        secrets.
                    </Box>
                </Typography>
            </Box>
            {isTheOnlyDevice ? (
                <>
                    <Box sx={{ my: 2 }}>
                        <Typography variant={"h6"}>Add a new device</Typography>{" "}
                    </Box>
                    <Box sx={{ my: 2 }}>
                        <Typography>
                            This is the only device connected to your account.
                            Without syncing another device, if you lose access
                            to this one, the secrets will be lost. As a
                            consequence you won't be allowed to change your
                            responses in polls/votes you already registered to,
                            and ZKorum will not be able to tell what posts you
                            created.
                        </Typography>
                    </Box>
                </>
            ) : null}
            {!hasFilledForms ? (
                <>
                    <Box sx={{ my: 2 }}>
                        <Typography variant={"h6"}>Fill the forms</Typography>{" "}
                    </Box>

                    <Box sx={{ my: 2 }}>
                        <Typography>
                            Before using ZKorum, you need to fill forms to
                            verify your identity. Thanks to Zero-Knowledge
                            proofs, the posts you will create cannot trace back
                            to your account or to the forms, yet we can verify
                            they originated from some anonymous invididual in
                            your community.
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
