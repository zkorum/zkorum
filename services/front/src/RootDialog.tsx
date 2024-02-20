import { useAppDispatch, useAppSelector } from "@/hooks";
import { closeSnackbar } from "@/store/reducers/snackbar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { AuthDialog } from "./components/auth/AuthDialog";
import { PostDialog } from "./components/post/PostDialog";
import type { FeedContextType, PostsType } from "./feed";
import type { PostUid, ResponseToPollPayload } from "./shared/types/zod";
import type { StateSnapshot } from "react-virtuoso";

export interface UpdatePostHiddenStatusProps {
    uid: PostUid;
    isHidden: boolean;
}

export function RootDialog() {
    const [posts, setPosts] = React.useState<PostsType>(() => []);
    const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
    const [loadingRecent, setLoadingRecent] = React.useState<boolean>(false);
    const [virtuosoState, setVirtuosoState] = React.useState<
        StateSnapshot | undefined
    >(undefined);

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

    function updatePostHiddenStatus({
        uid,
        isHidden,
    }: UpdatePostHiddenStatusProps): void {
        const newPosts = [...posts];
        for (const post of newPosts) {
            if (post.metadata.uid === uid) {
                post.metadata.isHidden = isHidden;
            }
        }
        setPosts(newPosts);
    }

    function updatePost(responseToPoll: ResponseToPollPayload): void {
        const newPosts = [...posts];
        for (const post of newPosts) {
            if (post.metadata.uid === responseToPoll.postUid) {
                if (post.payload.poll === undefined) {
                    console.warn(
                        "Trying to answer to a post which doesn't have poll"
                    );
                    return;
                }
                switch (responseToPoll.optionChosen) {
                    case 1:
                        post.payload.poll.result.option1Response =
                            post.payload.poll.result.option1Response + 1;
                        break;
                    case 2:
                        post.payload.poll.result.option2Response =
                            post.payload.poll.result.option2Response + 1;
                        break;
                    case 3:
                        post.payload.poll.result.option3Response =
                            post.payload.poll.result.option3Response !==
                            undefined
                                ? post.payload.poll.result.option3Response + 1
                                : 1;
                        break;
                    case 4:
                        post.payload.poll.result.option4Response =
                            post.payload.poll.result.option4Response !==
                            undefined
                                ? post.payload.poll.result.option4Response + 1
                                : 1;
                        break;
                    case 5:
                        post.payload.poll.result.option5Response =
                            post.payload.poll.result.option5Response !==
                            undefined
                                ? post.payload.poll.result.option5Response + 1
                                : 1;
                        break;
                    case 6:
                        post.payload.poll.result.option6Response =
                            post.payload.poll.result.option6Response !==
                            undefined
                                ? post.payload.poll.result.option6Response + 1
                                : 1;
                        break;
                }
            }
        }
        setPosts(newPosts);
    }

    return (
        <Box>
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
                        updatePost,
                        updatePostHiddenStatus,
                        loadingMore,
                        setLoadingMore,
                        loadingRecent,
                        setLoadingRecent,
                        virtuosoState,
                        setVirtuosoState,
                    } satisfies FeedContextType
                }
            />
            <ScrollRestoration
                getKey={(location, _matches) => {
                    return location.pathname;
                }}
            />
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
