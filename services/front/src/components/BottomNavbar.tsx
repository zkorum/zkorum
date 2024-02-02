import * as React from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { useLocation, useNavigate } from "react-router-dom";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { type SxProps } from "@mui/material/styles";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { COMMUNITIES, JOBS, NOTIFICATIONS } from "@/common/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { openPostModal } from "@/store/reducers/post";
import { selectActiveSessionStatus } from "@/store/selector";
import { openAuthModal } from "@/store/reducers/session";
import WorkIcon from "@mui/icons-material/Work";

enum Nav {
    Home = "Home",
    Jobs = "Jobs",
    Communities = "Communities",
    Notifications = "Notifications",
    Post = "Post",
}

export function BottomNavbar() {
    const dispatch = useAppDispatch();
    const activeSessionStatus = useAppSelector(selectActiveSessionStatus);
    const trigger = useScrollTrigger();
    const [value, setValue] = React.useState<Nav>(Nav.Home);
    const [isHidden, setIsHidden] = React.useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        const { pathname } = location;
        if (pathname === JOBS) {
            setValue(Nav.Jobs);
        } else if (pathname.startsWith(COMMUNITIES)) {
            setValue(Nav.Communities);
        } else if (pathname.startsWith(NOTIFICATIONS)) {
            setValue(Nav.Notifications);
        } else {
            setValue(Nav.Home);
        }
    }, [location]);

    // To place the add icon
    // https://github.com/mui/material-ui/issues/15662#issuecomment-492771975

    React.useEffect(() => {
        if (trigger) {
            setIsHidden(true);
        } else {
            setIsHidden(false);
        }
    }, [trigger]);

    const handleChange = (_event: React.SyntheticEvent, newValue: Nav) => {
        switch (newValue) {
            case Nav.Home:
                setValue(Nav.Home);
                navigate("/");
                break;
            case Nav.Jobs:
                setValue(Nav.Jobs);
                navigate(JOBS);
                break;
            case Nav.Communities:
                setValue(Nav.Communities);
                navigate(COMMUNITIES);
                break;
            case Nav.Notifications:
                setValue(Nav.Notifications);
                navigate(NOTIFICATIONS);
                break;
            case Nav.Post:
                if (activeSessionStatus === "logged-in") {
                    dispatch(openPostModal());
                    break;
                } else {
                    dispatch(openAuthModal());
                }
        }
    };

    const showBottomNavbar: SxProps = {
        pb: 7,
    };

    const hideBottomNavbar: SxProps = {
        pb: 7,
        visibility: "hidden",
    };

    return (
        <Box sx={isHidden ? hideBottomNavbar : showBottomNavbar}>
            <Paper
                sx={{
                    position: "fixed",
                    bottom: 0,
                    height: "56px",
                    width: "100%",
                    zIndex: 999,
                }}
                elevation={3}
            >
                <BottomNavigation value={value} onChange={handleChange}>
                    <BottomNavigationAction
                        label={Nav.Home}
                        value={Nav.Home}
                        icon={<HomeIcon />}
                        sx={{ minWidth: "60px" }}
                    />
                    <BottomNavigationAction
                        disabled
                        label={Nav.Communities}
                        value={Nav.Communities}
                        icon={<GroupsIcon color="disabled" />}
                        sx={{ visibility: "hidden", minWidth: "60px" }}
                    />
                    <BottomNavigationAction
                        label={Nav.Post}
                        value={Nav.Post}
                        icon={<AddCircleOutlineIcon />}
                        sx={{ minWidth: "60px" }}
                    />
                    <BottomNavigationAction
                        disabled
                        label={Nav.Notifications}
                        value={Nav.Notifications}
                        icon={
                            <Badge
                                color="error"
                                sx={{
                                    "& .MuiBadge-badge": {
                                        right: 2,
                                        top: 3,
                                    },
                                }}
                                // badgeContent={4}
                            >
                                <NotificationsIcon color="disabled" />
                            </Badge>
                        }
                        sx={{ visibility: "hidden", minWidth: "60px" }}
                    />
                    <BottomNavigationAction
                        disabled
                        label={Nav.Jobs}
                        value={Nav.Jobs}
                        icon={<WorkIcon color="disabled" />}
                        sx={{ visibility: "hidden", minWidth: "60px" }}
                    />
                </BottomNavigation>
            </Paper>
        </Box>
    );
}
