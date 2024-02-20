import { FEED } from "@/common/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import { useLocation, useNavigate } from "react-router-dom";
import { GoBackButton } from "../shared/GoBackButton";

export function PostPageTopbar() {
    const navigate = useNavigate();
    const location = useLocation();

    function scrollToTop() {
        window.scrollTo(0, 0);
    }

    return (
        <>
            <AppBar>
                <Toolbar onClick={scrollToTop} disableGutters>
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
                                onClick={(e) => {
                                    e.stopPropagation();
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
