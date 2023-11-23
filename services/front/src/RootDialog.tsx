import Box from "@mui/material/Box";
import { AuthDialog } from "./components/auth/AuthDialog";
import { PostDialog } from "./components/post/PostDialog";
import { Outlet } from "react-router-dom";
import React from "react";
import type { ContextType, PostsType } from "./feed";

export function RootDialog() {
    const [posts, setPosts] = React.useState<PostsType>(() => []);
    const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
    const [loadingRecent, setLoadingRecent] = React.useState<boolean>(false);

    return (
        <Box sx={{ backgroundColor: "red" }}>
            <AuthDialog />
            <PostDialog
                posts={posts}
                setPosts={setPosts}
                setLoadingMore={setLoadingMore}
                setLoadingRecent={setLoadingRecent}
            />
            <Outlet
                context={
                    {
                        posts,
                        setPosts,
                        loadingMore,
                        setLoadingMore,
                        loadingRecent,
                        setLoadingRecent,
                    } satisfies ContextType
                }
            />
        </Box>
    );
}
