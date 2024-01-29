import { useAppDispatch } from "@/hooks";
import Grid from "@mui/material/Unstable_Grid2";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { NOTIFICATIONS } from "@/common/navigation";
import Typography from "@mui/material/Typography";

export function LoggedInUserMustPerformActionPage({}) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // @ts-ignore - TODO this is unused TEMPORARILY
    function handleOnSync() {
        navigate(NOTIFICATIONS);
        dispatch(closeAuthModal());
        dispatch(resetPendingSession());
    }

    function handleOnSkip() {
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
            <Box sx={{ my: 2 }}>
                <Typography variant={"h6"}>
                    Add a new device (recommended)
                </Typography>{" "}
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography component="div">
                    This is the only device connected to your account.{" "}
                    <Box fontWeight="fontWeightMedium" display="inline">
                        If you lose access to this device, uninstall the app or
                        delete its cache,
                    </Box>{" "}
                    the secret keys will be lost. As a consequence, you would
                    not be able to respond to polls/votes created before you
                    lost your device, and ZKorum will not be able to tell what
                    posts you created.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Grid
                    container
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                >
                    <Grid>
                        <Button
                            disabled
                            size="small"
                            onClick={handleOnSync}
                            variant="contained"
                        >
                            Link new device
                        </Button>
                    </Grid>
                    <Grid>
                        <Button
                            onClick={handleOnSkip}
                            // variant={isTheOnlyDevice ? "outlined" : "contained"}
                            variant={"contained"}
                        >
                            Skip for now
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
