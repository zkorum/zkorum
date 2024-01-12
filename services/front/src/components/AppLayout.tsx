import { usePostsAndMeta } from "@/feed";
import { useAppSelector } from "@/hooks";
import { fetchAndUpdateCredentials } from "@/request/credential";
import {
    selectActiveSessionEmail,
    selectActiveSessionUserId,
} from "@/store/selector";
import Box from "@mui/material/Box";
import React from "react";
import { Outlet } from "react-router-dom";
import { BottomNavbar } from "./BottomNavbar";
import { Topbar } from "./Topbar";

export function AppLayout() {
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);

    const {
        posts,
        setPosts,
        updatePost,
        updatePostHiddenStatus,
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
        <Box sx={{ height: "100%", backgroundColor: "#e6e9ec" }}>
            <Topbar />
            <Outlet
                context={{
                    posts,
                    setPosts,
                    updatePost,
                    updatePostHiddenStatus,
                    loadingMore,
                    setLoadingMore,
                    loadingRecent,
                    setLoadingRecent,
                }}
            />
            <Box>
                {/* https://stackoverflow.com/a/48510444/11046178 */}
                <Box sx={(theme) => theme.mixins.toolbar} />
            </Box>
            <BottomNavbar />
        </Box>
    );
}
