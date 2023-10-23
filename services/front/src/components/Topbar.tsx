import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { HideOnScroll } from "./HideOnScroll";
import Button from "@mui/material/Button";
import { openAuthModal } from "../store/reducers/session";
import { useAppDispatch, useAppSelector } from "../hooks";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import { useNavigate } from "react-router-dom";
import { LoginMenu } from "./auth/LoginMenu";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
// import { ReactComponent as ZKorumIcon } from "../assets/logo.svg";
// import SvgIcon from "@mui/material/SvgIcon";

// function CustomIcon() {
//   return <ZKorumIcon style={{ height: "36px" }} />;
// }
//
export function Topbar() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const activeSessionEmail = useAppSelector((state) => {
        return state.sessions.activeSessionEmail;
    });

    return (
        <>
            <HideOnScroll direction={"down"}>
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
                                {activeSessionEmail === "" ? (
                                    <Button
                                        variant="contained"
                                        onClick={() =>
                                            dispatch(openAuthModal())
                                        }
                                    >
                                        Log in
                                    </Button>
                                ) : (
                                    <LoginMenu />
                                )}
                            </Grid>
                            <Grid flexGrow={1}>
                                <TextField
                                    margin="none"
                                    fullWidth
                                    id="standard-basic"
                                    variant="standard"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid>
                                <IconButton
                                    aria-label="notifications"
                                    onClick={() => navigate("/notifications")}
                                >
                                    <Badge
                                        color="error"
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                right: 2,
                                                top: 3,
                                            },
                                        }}
                                        badgeContent={4}
                                    >
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <Toolbar />
        </>
    );
}
