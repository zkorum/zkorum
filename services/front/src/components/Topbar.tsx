import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import { HideOnScroll } from "./HideOnScroll";
import Button from "@mui/material/Button";
import { openAuthModal } from "../store/reducers/session";
import { useAppDispatch, useAppSelector } from "../hooks";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
// import { useNavigate } from "react-router-dom";
import { LoginMenu } from "./auth/LoginMenu";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import MenuList from "@mui/material/MenuList";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DevicesIcon from "@mui/icons-material/Devices";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Link from "@mui/material/Link";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

    const isTheOnlyDevice = useAppSelector((state) => {
        const activeSessionEmail = state.sessions.activeSessionEmail;
        if (
            activeSessionEmail === "" ||
            !(activeSessionEmail in state.sessions.sessions) ||
            state.sessions.sessions[activeSessionEmail].status !== "logged-in"
        ) {
            return false;
        }
        const syncingDevices =
            state.sessions.sessions[activeSessionEmail]?.syncingDevices;
        if (syncingDevices === undefined) {
            return true;
        }
        return syncingDevices.length === 1;
    });
    const [anchorElMoreMenu, setAnchorElMoreMenu] =
        React.useState<null | HTMLElement>(null);
    const moreMenuIsOpen = Boolean(anchorElMoreMenu);
    const handleClickMoreMenu = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setAnchorElMoreMenu(event.currentTarget);
    };
    const handleCloseMoreMenu = () => {
        setAnchorElMoreMenu(null);
    };

    function handleOnClickAbout() {
        handleCloseMoreMenu();
    }

    function handleOnClickDevices() {
        handleCloseMoreMenu();
    }

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
                            <Grid flexGrow={1} maxWidth="50%">
                                <TextField
                                    disabled
                                    sx={{ visibility: "hidden" }}
                                    placeholder="Coming soon..."
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
                                    aria-controls={
                                        moreMenuIsOpen
                                            ? "more-vert-button"
                                            : undefined
                                    }
                                    aria-haspopup="true"
                                    aria-expanded={
                                        moreMenuIsOpen ? "true" : undefined
                                    }
                                    onClick={handleClickMoreMenu}
                                >
                                    {isTheOnlyDevice ? (
                                        <Badge
                                            color="error"
                                            variant="dot"
                                            invisible={false}
                                        >
                                            <MoreVertIcon />
                                        </Badge>
                                    ) : (
                                        <MoreVertIcon />
                                    )}
                                </IconButton>
                                <Menu
                                    id="more-menu"
                                    anchorEl={anchorElMoreMenu}
                                    open={moreMenuIsOpen}
                                    onClose={handleCloseMoreMenu}
                                >
                                    <MenuList>
                                        <MenuItem
                                            disabled
                                            onClick={() =>
                                                handleOnClickDevices()
                                            }
                                        >
                                            <ListItemIcon>
                                                {isTheOnlyDevice ? (
                                                    <Badge
                                                        color="error"
                                                        variant="dot"
                                                        invisible={false}
                                                    >
                                                        <DevicesIcon fontSize="small" />
                                                    </Badge>
                                                ) : (
                                                    <DevicesIcon fontSize="small" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText>Devices</ListItemText>
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => handleOnClickAbout()}
                                        >
                                            <Link
                                                target="_blank"
                                                rel="noreferrer"
                                                href="https://about.zkorum.com"
                                                color="inherit"
                                                underline="none"
                                            >
                                                <Grid container direction="row">
                                                    <Grid>
                                                        <ListItemIcon>
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </ListItemIcon>
                                                    </Grid>
                                                    <Grid
                                                        container
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="center"
                                                        alignItems="flex-start"
                                                    >
                                                        <Grid>
                                                            <ListItemText>
                                                                About
                                                            </ListItemText>
                                                        </Grid>
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
                                            </Link>
                                        </MenuItem>
                                    </MenuList>
                                </Menu>
                                {/* <Menu */}
                                {/*     id="more-menu" */}
                                {/*     anchorEl={anchorElMoreMenu} */}
                                {/*     open={moreMenuIsOpen} */}
                                {/*     onClose={handleCloseMoreMenu} */}
                                {/*     MenuListProps={{ */}
                                {/*         "aria-labelledby": "basic-button", */}
                                {/*     }} */}
                                {/* > */}
                                {/*     <MenuItem onClick={handleCloseMoreMenu}> */}
                                {/*         About */}
                                {/*     </MenuItem> */}
                                {/*     <MenuItem onClick={handleCloseMoreMenu}> */}
                                {/*         My devices */}
                                {/*     </MenuItem> */}
                                {/* </Menu> */}
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <Toolbar />
        </>
    );
}
