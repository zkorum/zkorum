import Box from "@mui/material/Box";
import { Outlet } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { closeSnackbar } from "@/store/reducers/snackbar";
import { Topbar } from "./Topbar";
import { BottomNavbar } from "./BottomNavbar";
import Alert from "@mui/material/Alert";
import React from "react";
import { usePostsAndMeta } from "@/feed";
import {
    selectActiveSessionEmail,
    selectActiveSessionUserId,
} from "@/store/selector";
import { fetchAndUpdateCredentials } from "@/request/credential";

export function AppLayout() {
    const snackbarState = useAppSelector((state) => {
        return state.snackbar;
    });
    const dispatch = useAppDispatch();
    function handleCloseSnackbar(
        _event?: React.SyntheticEvent | Event,
        reason?: string
    ) {
        if (reason === "clickaway") {
            return;
        }
        dispatch(closeSnackbar());
    }
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);

    const {
        posts,
        setPosts,
        loadingMore,
        setLoadingMore,
        loadingRecent,
        setLoadingRecent,
    } = usePostsAndMeta();

    React.useEffect(() => {
        // this will set the values in redux store and eventually update this page
        const fetchData = async function () {
            if (activeSessionUserId !== undefined) {
                try {
                    await fetchAndUpdateCredentials(
                        activeSessionUserId,
                        activeSessionEmail
                    );
                } catch (e) {
                    console.error(e);
                }
            }
        };
        fetchData();
    }, []);

    /* <Container maxWidth={false} disableGutters> */
    return (
        <Box sx={{ backgroundColor: "#e6e9ec" }}>
            <Topbar />
            <Outlet
                context={{
                    posts,
                    setPosts,
                    loadingMore,
                    setLoadingMore,
                    loadingRecent,
                    setLoadingRecent,
                }}
            />
            <BottomNavbar />
            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                open={snackbarState.isOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                sx={{ bottom: { xs: 90, sm: 90, xl: 90 } }} // important to be above the bottom navbar
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarState.severity}
                >
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
