import { HASH_IS_COMMENTING, POST } from "@/common/navigation";
import { doLoadMore, doLoadRecent, usePostsAndMeta } from "@/feed";
import { useAppSelector } from "@/hooks";
import type { ExtendedPostData } from "@/shared/types/zod";
import { selectActiveSessionEmail } from "@/store/selector";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";
import { PostView } from "./PostView";

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
    const isLoggedIn =
        activeSessionEmail !== "" && activeSessionEmail !== undefined;
    const isAdmin = activeSessionEmail.endsWith("zkorum.com");

    const navigate = useNavigate();

    const loadRecent = React.useCallback(
        (lastReactedAt: Date) => {
            return setTimeout(async () => {
                return await doLoadRecent(
                    isAdmin,
                    posts,
                    setPosts,
                    setLoadingRecent,
                    lastReactedAt
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
                    isAdmin,
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
            recentTimeout = loadRecent(posts[0].metadata.lastReactedAt);
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
        posts: ExtendedPostData[];
        isLoggedIn: boolean;
    }

    interface LoadingProps {
        context?: LoadingContext;
    }

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
                    ) : context?.posts.length !== undefined &&
                      context.posts.length <= 4 ? (
                        <Button
                            size="small"
                            color={"inherit"}
                            onClick={() =>
                                doLoadMore(
                                    isAdmin,
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
                    const postPage = `${POST}/${post.metadata.slugId}`;
                    const routeToNavigateTo = isLoggedIn
                        ? `${postPage}${HASH_IS_COMMENTING}`
                        : `${postPage}`;

                    return (
                        <Box
                            key={`commentview-${post.metadata.slugId}`}
                            pt={1}
                            width="100%"
                        >
                            <Link
                                href={postPage}
                                underline="none"
                                sx={{
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <PostView
                                    viewMode={"feed"}
                                    onComment={(
                                        event: React.MouseEvent<HTMLElement>
                                    ) => {
                                        event.preventDefault();
                                        navigate(routeToNavigateTo);
                                    }}
                                    post={post}
                                    updatePost={updatePost}
                                    updatePostHiddenStatus={
                                        updatePostHiddenStatus
                                    }
                                />
                            </Link>
                        </Box>
                    );
                }}
                components={{ Footer: LoadingMore }}
            />
        </Container>
    );
}
