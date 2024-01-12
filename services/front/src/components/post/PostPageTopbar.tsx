import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import { GoBackButton } from "../shared/GoBackButton";
import { useNavigate } from "react-router-dom";

export function PostPageTopbar() {
    const navigate = useNavigate();
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
                            <GoBackButton onClick={() => navigate(-1)} />
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            <Toolbar />
        </>
    );
}
