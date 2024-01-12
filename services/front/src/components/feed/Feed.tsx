import Box from "@mui/material/Box";
import { PostView } from "./PostView";
import React from "react";
import Container from "@mui/material/Container";
import { Virtuoso } from "react-virtuoso";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Unstable_Grid2";
import type { ExtendedPollData } from "@/shared/types/zod";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { doLoadMore, doLoadRecent, usePostsAndMeta } from "@/feed";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { selectActiveSessionEmail } from "@/store/selector";
import { openAuthModal } from "@/store/reducers/session";

export function Feed() {
    const {
        posts,
        updatePost,
        updatePostHiddenStatus,
        setPosts,
        loadingMore,
        setLoadingMore,
        loadingRecent,
        setLoadingRecent,
    } = usePostsAndMeta();

    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const dispatch = useAppDispatch();

    const loadRecent = React.useCallback(
        (minUpdatedAt: Date) => {
            return setTimeout(async () => {
                return await doLoadRecent(
                    posts,
                    setPosts,
                    setLoadingRecent,
                    minUpdatedAt
                );
            }, 200);
        },
        [setPosts, setLoadingRecent]
    );

    const loadMore = React.useCallback(
        (onlyIfLoggedIn: boolean, lastIndex?: number) => {
            return setTimeout(async () => {
                if (
                    onlyIfLoggedIn &&
                    (activeSessionEmail === "" ||
                        activeSessionEmail === undefined)
                ) {
                    return;
                }
                return await doLoadMore(
                    posts,
                    setPosts,
                    setLoadingMore,
                    lastIndex
                );
            }, 200);
        },
        [activeSessionEmail, setPosts, setLoadingMore, posts]
    );

    React.useEffect(() => {
        let moreTimeout: NodeJS.Timeout | undefined = undefined;
        let recentTimeout: NodeJS.Timeout | undefined = undefined;
        if (posts.length === 0) {
            moreTimeout = loadMore(false);
        } else if (
            activeSessionEmail !== "" &&
            activeSessionEmail !== undefined
        ) {
            recentTimeout = loadRecent(posts[0].metadata.updatedAt);
            if (posts.length === 0) {
                moreTimeout = loadMore(true);
            } else {
                moreTimeout = loadMore(true, posts.length - 1);
            }
        }
        if (moreTimeout !== undefined || recentTimeout !== undefined) {
            return () => {
                if (moreTimeout !== undefined) {
                    clearTimeout(moreTimeout);
                    setLoadingMore(false);
                }
                if (recentTimeout !== undefined) {
                    clearTimeout(recentTimeout);
                    setLoadingRecent(false);
                }
            };
        }
    }, [activeSessionEmail]);

    interface LoadingContext {
        loadingMore: boolean;
        loadingRecent: boolean;
        posts: ExtendedPollData[];
        isLoggedIn: boolean;
    }

    interface LoadingProps {
        context?: LoadingContext;
    }

    const LoadingRecent = ({ context }: LoadingProps) => {
        return (
            <Grid container justifyContent="center" alignItems="center">
                <Grid>
                    {context?.loadingRecent ? (
                        <Box sx={{ mt: 1, color: "#fff" }}>
                            <CircularProgress size="1em" color="inherit" />
                        </Box>
                    ) : null}
                </Grid>
            </Grid>
        );
    };

    const LoadingMore = ({ context }: LoadingProps) => {
        return (
            <Grid pt={1} container justifyContent="center" alignItems="center">
                <Grid>
                    {context?.loadingMore ? (
                        <Box sx={{ mt: 1, color: "#fff" }}>
                            <CircularProgress size="1em" color="inherit" />
                        </Box>
                    ) : context?.posts.length === undefined ||
                      context?.posts.length === 0 ? (
                        <Typography>Initializing...</Typography>
                    ) : context?.isLoggedIn ? (
                        context?.posts.length !== undefined &&
                        context.posts.length <= 4 ? (
                            <Button
                                size="small"
                                color={"inherit"}
                                onClick={() =>
                                    doLoadMore(
                                        posts,
                                        setPosts,
                                        setLoadingMore,
                                        posts.length === 0
                                            ? undefined
                                            : posts.length - 1
                                    )
                                }
                            >
                                Load more
                            </Button>
                        ) : (
                            <Typography>No more posts</Typography>
                        )
                    ) : (
                        <Button
                            size="small"
                            color={"inherit"}
                            onClick={() => dispatch(openAuthModal())}
                        >
                            Log in to load more
                        </Button>
                    )}
                </Grid>
            </Grid>
        );
    };

    return (
        <Container maxWidth="sm" disableGutters>
            <Virtuoso
                useWindowScroll
                data={posts}
                endReached={(index) => loadMore(true, index)}
                context={{
                    loadingMore: loadingMore,
                    loadingRecent: loadingRecent,
                    posts: posts,
                    isLoggedIn:
                        activeSessionEmail !== "" &&
                        activeSessionEmail !== undefined,
                }}
                overscan={200}
                itemContent={(_index, post) => {
                    return (
                        <Box pt={1} key={`commentview-${post.metadata.slugId}`}>
                            <PostView
                                post={post}
                                updatePost={updatePost}
                                updatePostHiddenStatus={updatePostHiddenStatus}
                            />
                        </Box>
                    );
                }}
                components={{ Footer: LoadingMore, Header: LoadingRecent }}
            />
        </Container>
    );
}
