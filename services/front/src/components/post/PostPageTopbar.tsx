import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import { GoBackButton } from "../shared/GoBackButton";
import { useLocation, useNavigate } from "react-router-dom";
import { FEED } from "@/common/navigation";

export function PostPageTopbar() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <>
            <AppBar>
                <Toolbar disableGutters>
                    <Grid
                        sx={{ ml: 0.2 }}
                        container
                        width="100%"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                    >
                        <Grid>
                            <GoBackButton
                                onClick={() => {
                                    if (location.key !== "default") {
                                        navigate(-1);
                                    } else {
                                        navigate(FEED);
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            <Toolbar />
        </>
    );
}
