import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import { useAppDispatch, useAppSelector } from "../hooks";
import { openAuthModal } from "../store/reducers/session";
import { HideOnScroll } from "./HideOnScroll";
// import { useNavigate } from "react-router-dom";
import { ZKorumIcon } from "@/ZKorumIcon";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Box from "@mui/material/Box";
import { LoginMenu } from "./auth/LoginMenu";
// import { ReactComponent as ZKorumIcon } from "../assets/logo.svg";
// import SvgIcon from "@mui/material/SvgIcon";

// function CustomIcon() {
//   return <ZKorumIcon style={{ height: "36px" }} />;
// }

export function Topbar() {
    const dispatch = useAppDispatch();
    // const navigate = useNavigate();
    const activeSessionEmail = useAppSelector((state) => {
        return state.sessions.activeSessionEmail;
    });

    function scrollToTop() {
        window.scrollTo(0, 0);
    }

    return (
        <>
            <HideOnScroll direction={"down"}>
                <AppBar onClick={scrollToTop}>
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
                                {activeSessionEmail === "" ? (
                                    <Button
                                        variant="outlined"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(openAuthModal());
                                        }}
                                    >
                                        Log in
                                    </Button>
                                ) : (
                                    <LoginMenu />
                                )}
                            </Grid>
                            <Grid flexGrow={1} maxWidth="50%">
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
                                                <ZKorumIcon />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid sx={{ color: "grey" }}>
                                <Button
                                    sx={{ textTransform: "none" }}
                                    variant="text"
                                    color="inherit"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        window.open(
                                            "https://about.zkorum.com/",
                                            "_blank",
                                            "noopener, noreferrer"
                                        );
                                    }}
                                >
                                    <Grid container direction="row">
                                        <Grid
                                            container
                                            direction="row"
                                            spacing={1}
                                            justifyContent="center"
                                            alignItems="flex-start"
                                        >
                                            <Grid>About</Grid>
                                            <Grid>
                                                <FontAwesomeIcon
                                                    // color="rgba(0, 0, 0, 0.6)"
                                                    size="xs"
                                                    icon={
                                                        faArrowUpRightFromSquare
                                                    }
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Button>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <Toolbar />
        </>
    );
}
