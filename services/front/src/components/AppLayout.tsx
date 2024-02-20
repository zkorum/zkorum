import { usePostsAndMeta } from "@/feed";
import { useAppSelector } from "@/hooks";
import { fetchAndUpdateCredentials } from "@/request/credential";
import type { SessionStatus } from "@/store/reducers/session";
import {
    selectActiveSessionEmail,
    selectActiveSessionStatus,
    selectActiveSessionUserId,
} from "@/store/selector";
import Box from "@mui/material/Box";
import React from "react";
import { Outlet } from "react-router-dom";
import { BottomNavbar } from "./BottomNavbar";
import { Topbar } from "./Topbar";

interface FetchDataProps {
    activeSessionStatus: SessionStatus | undefined;
    activeSessionUserId: string | undefined;
    activeSessionEmail: string;
}

export const fetchData = async function ({
    activeSessionStatus,
    activeSessionUserId,
    activeSessionEmail,
}: FetchDataProps) {
    if (
        activeSessionStatus === "logged-in" &&
        activeSessionUserId !== undefined
    ) {
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

export const feedWrapperId = "feedWrapper";

export function AppLayout() {
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);
    const activeSessionStatus = useAppSelector(selectActiveSessionStatus);

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
        fetchData({
            activeSessionStatus,
            activeSessionUserId,
            activeSessionEmail,
        });
    }, []);

    /* <Container maxWidth={false} disableGutters> */
    return (
        <Box sx={{ height: "100%", backgroundColor: "#e6e9ec" }}>
            <Topbar />
            <Box id={feedWrapperId}>
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
            </Box>
            <Box>
                {/* https://stackoverflow.com/a/48510444/11046178 */}
                <Box sx={(theme) => theme.mixins.toolbar} />
            </Box>
            <BottomNavbar />
        </Box>
    );
}
