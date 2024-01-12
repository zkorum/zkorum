import { getTimeFromNow, getTrimmedPseudonym } from "@/common/common";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { hideComment, unhideComment } from "@/request/moderation";
import type { PostComment, PostPseudonym } from "@/shared/types/zod";
import { showError } from "@/store/reducers/snackbar";
import { selectActiveSessionEmail } from "@/store/selector";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import { genericError } from "../error/message";
import type { UpdateCommentHiddenStatusProps } from "./PostPage";

export type UserResponse =
    | "option1"
    | "option2"
    | "option3"
    | "option4"
    | "option5"
    | "option6";

interface CommentViewProps {
    comment: PostComment;
    opPseudonym: PostPseudonym;
    updateCommentHiddenStatus: (props: UpdateCommentHiddenStatusProps) => void;
}

export function CommentView({
    updateCommentHiddenStatus,
    comment,
    opPseudonym,
}: CommentViewProps) {
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const dispatch = useAppDispatch();
    const [isHideLoading, setIsHideLoading] = React.useState<boolean>(false);
    const [isUnhideLoading, setIsUnhideLoading] =
        React.useState<boolean>(false);

    async function handleHide() {
        setIsHideLoading(true);
        try {
            await hideComment({ commentSlugId: comment.metadata.slugId });
            updateCommentHiddenStatus({
                slugId: comment.metadata.slugId,
                isHidden: true,
            });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsHideLoading(false);
        }
    }

    async function handleUnhide() {
        setIsUnhideLoading(true);
        try {
            await unhideComment({ commentSlugId: comment.metadata.slugId });
            updateCommentHiddenStatus({
                slugId: comment.metadata.slugId,
                isHidden: false,
            });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsUnhideLoading(false);
        }
    }

    const isAdmin = activeSessionEmail.endsWith("zkorum.com");

    return (
        // lines
        <Paper
            elevation={0}
            sx={{ opacity: `${comment.metadata.isHidden === true ? 0.5 : 1}` }}
        >
            <Box sx={{ pt: 2, pb: 1, px: 2 }}>
                <Grid container spacing={1} direction="column">
                    <Grid
                        container
                        spacing={2}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                    >
                        <Grid
                            p="0"
                            container
                            alignItems="flex-start"
                            justifyContent="flex-start"
                            direction="column"
                            gap={0}
                            spacing={0}
                        >
                            <Grid>
                                <Grid
                                    sx={{ height: 20 }}
                                    container
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            ESSEC
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            •
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            {`${getTrimmedPseudonym(
                                                comment.author.pseudonym
                                            )}`}
                                        </Typography>
                                    </Grid>
                                    {comment.author.pseudonym ===
                                    opPseudonym ? (
                                        <Grid>
                                            <Typography
                                                color="primary"
                                                sx={{
                                                    fontSize: 12,
                                                }}
                                                variant="body2"
                                            >
                                                OP
                                            </Typography>
                                        </Grid>
                                    ) : null}
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            •
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            {getTimeFromNow(
                                                comment.metadata.updatedAt
                                            )}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                        {isAdmin ? (
                            <Grid
                                justifySelf="flex-end"
                                sx={{ marginLeft: "auto" }}
                            >
                                {comment.metadata.isHidden === true ? (
                                    <LoadingButton
                                        loading={isUnhideLoading}
                                        onClick={handleUnhide}
                                        size="small"
                                        variant="outlined"
                                    >
                                        Unhide
                                    </LoadingButton>
                                ) : (
                                    <LoadingButton
                                        loading={isHideLoading}
                                        onClick={handleHide}
                                        size="small"
                                        variant="contained"
                                    >
                                        Hide
                                    </LoadingButton>
                                )}
                            </Grid>
                        ) : null}
                    </Grid>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={1}
                        sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
                    >
                        <Grid sx={{ p: 1 }}>
                            <Typography variant="body1">
                                {comment.metadata.isHidden && !isAdmin
                                    ? "[This comment was moderated]"
                                    : comment.content}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
}
