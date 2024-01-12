import { usePost } from "@/post";
import { fetchMoreComments, fetchRecentComments } from "@/request/post";
import type {
    ExtendedPollData,
    PostComment,
    PostSlugId,
} from "@/shared/types/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import { ErrorPage } from "../error/ErrorPage";
import { PostView } from "../feed/PostView";
import { CommentView } from "./CommentView";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { selectActiveSessionEmail } from "@/store/selector";
import { openAuthModal } from "@/store/reducers/session";

export interface UpdateCommentHiddenStatusProps {
    slugId: PostSlugId;
    isHidden: boolean;
}

export function PostPage() {
    const {
        post,
        comments,
        setComments,
        postSlugId,
        updatePost,
        updatePostHiddenStatus,
        wasCommentSent,
        commentInputRef,
    } = usePost();
    const [loadingRecent, setLoadingRecent] = React.useState<boolean>(false);
    const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const dispatch = useAppDispatch();

    function updateCommentHiddenStatus({
        slugId,
        isHidden,
    }: UpdateCommentHiddenStatusProps): void {
        const updatedComments = [...comments];
        for (const comment of updatedComments) {
            if (comment.metadata.slugId === slugId) {
                comment.metadata.isHidden = isHidden;
            }
        }
        setComments(updatedComments);
    }

    const loadRecent = React.useCallback(
        (minUpdatedAt?: Date) => {
            return setTimeout(async () => {
                return await doLoadRecentComments(minUpdatedAt);
            }, 200);
        },
        [setComments, setLoadingRecent]
    );

    const loadMore = React.useCallback(
        (lastIndex?: number) => {
            return setTimeout(async () => {
                return await doLoadMoreComments(lastIndex);
            }, 200);
        },
        [setComments, setLoadingMore, comments]
    );

    React.useEffect(() => {
        if (wasCommentSent) {
            setLoadingRecent(true);
            const recentTimeout = loadRecent(
                comments.length > 0 ? comments[0].metadata.updatedAt : undefined
            );
            return () => {
                clearTimeout(recentTimeout);
                setLoadingRecent(false);
            };
        }
    }, [wasCommentSent]);

    async function doLoadMoreComments(lastIndex?: number) {
        if (postSlugId !== undefined) {
            try {
                setLoadingMore(true);
                const lastPostUpdatedAt =
                    lastIndex === undefined || lastIndex === 0
                        ? undefined
                        : comments[lastIndex].metadata.updatedAt;
                const newComments = await fetchMoreComments({
                    postSlugId: postSlugId,
                    updatedAt: lastPostUpdatedAt,
                });
                const actualNewComments = newComments.filter(
                    (comment) =>
                        !comments.some(
                            (existingComment) =>
                                existingComment.metadata.uid ===
                                comment.metadata.uid
                        )
                );
                if (actualNewComments.length !== 0) {
                    setComments((prevComments) => [
                        ...prevComments,
                        ...actualNewComments,
                    ]);
                }
            } finally {
                setLoadingMore(false);
            }
        }
    }

    async function doLoadRecentComments(minUpdatedAt?: Date) {
        if (postSlugId !== undefined) {
            try {
                setLoadingRecent(true);
                const newComments = await fetchRecentComments({
                    postSlugId: postSlugId,
                    updatedAt: minUpdatedAt,
                });
                const actualNewComments = newComments.filter(
                    (comment) =>
                        !comments.some(
                            (existingComment) =>
                                existingComment.metadata.uid ===
                                comment.metadata.uid
                        )
                );
                if (actualNewComments.length !== 0) {
                    setComments((prevComments) => [
                        ...actualNewComments,
                        ...prevComments,
                    ]);
                }
            } finally {
                setLoadingRecent(false);
            }
        }
    }

    interface LoadingContext {
        loadingMore: boolean;
        loadingRecent: boolean;
        comments: PostComment[];
    }

    interface LoadingProps {
        context?: LoadingContext;
    }

    const LoadingMore = ({ context }: LoadingProps) => {
        return (
            <Grid container justifyContent="center" alignItems="center">
                <Grid>
                    {context?.loadingMore ? null : context?.comments.length ===
                          undefined || context?.comments.length === 0 ? (
                        <Button
                            onClick={() =>
                                activeSessionEmail === "" ||
                                activeSessionEmail === undefined
                                    ? dispatch(openAuthModal())
                                    : commentInputRef.current?.focus()
                            }
                        >
                            Be the first to comment
                        </Button>
                    ) : null}
                </Grid>
            </Grid>
        );
    };

    function getRegularPage(post: ExtendedPollData) {
        return (
            <Container maxWidth="sm" disableGutters>
                <Box my={1}>
                    <PostView
                        post={post}
                        updatePost={updatePost}
                        updatePostHiddenStatus={updatePostHiddenStatus}
                    />
                </Box>
                <Box my={2}>
                    <Virtuoso
                        useWindowScroll
                        data={comments}
                        endReached={(index) => loadMore(index)}
                        overscan={200}
                        context={{
                            loadingMore: loadingMore,
                            loadingRecent: loadingRecent,
                            comments: comments,
                        }}
                        itemContent={(_index, comment) => {
                            return (
                                <Box
                                    sx={{ py: 0.3 }}
                                    key={`commentview-${comment.metadata.slugId}`}
                                >
                                    <CommentView
                                        updateCommentHiddenStatus={
                                            updateCommentHiddenStatus
                                        }
                                        comment={comment}
                                        opPseudonym={post.author.pseudonym}
                                    />
                                </Box>
                            );
                        }}
                        components={{
                            Footer: LoadingMore,
                        }}
                    />
                </Box>
            </Container>
        );
    }

    if (post === null) {
        // TODO better error page that keeps navigation
        return <ErrorPage />;
    } else if (post === undefined) {
        return (
            <Container maxWidth="sm" disableGutters>
                <Grid
                    mt={5}
                    container
                    justifyContent="center"
                    alignItems="center"
                >
                    <Grid>
                        <CircularProgress color="primary" />
                    </Grid>
                </Grid>
            </Container>
        );
    } else {
        return getRegularPage(post);
    }
}
