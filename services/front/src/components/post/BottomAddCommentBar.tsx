import { MAX_COMMENT_LENGTH } from "@/shared/shared";
import LoadingButton from "@mui/lab/LoadingButton";
import { Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import React from "react";
import { useBlocker } from "react-router-dom";
import { DiscardDialog } from "./DiscardDialog";

interface BottomAddCommentBarProps {
    setComment: (value: string) => void;
    onSendComment: () => Promise<void>;
    isSendingComment: boolean;
    isContextNotLoaded: boolean;
    wasCommentSent: boolean;
    setWasCommentSent: (value: boolean) => void;
    commentInputRef: React.MutableRefObject<HTMLInputElement | undefined>;
}

export function BottomAddCommentBar({
    setComment,
    isSendingComment,
    onSendComment,
    isContextNotLoaded,
    wasCommentSent,
    setWasCommentSent,
    commentInputRef,
}: BottomAddCommentBarProps) {
    const [localComment, setLocalComment] = React.useState<string>("");
    const [focused, setFocused] = React.useState<boolean>(false);

    const shouldSendingBeDisabled =
        localComment.length === 0 ||
        localComment.length > MAX_COMMENT_LENGTH ||
        isContextNotLoaded ||
        isSendingComment;

    const shouldWritingBeDisabled = isSendingComment || isContextNotLoaded;

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            localComment !== "" &&
            currentLocation.pathname !== nextLocation.pathname
    );

    React.useEffect(() => {
        if (wasCommentSent) {
            setLocalComment("");
        } else {
        }
    }, [wasCommentSent]);

    // prevents users than manually change URL to unexpectedly get rid of comment
    function beforeUnloadHandler(event: BeforeUnloadEvent) {
        // Recommended
        event.preventDefault();
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
    }

    React.useEffect(() => {
        if (localComment !== "") {
            window.addEventListener("beforeunload", beforeUnloadHandler);
        }
        return () => {
            window.removeEventListener("beforeunload", beforeUnloadHandler);
        };
    }, [localComment]);

    return (
        <>
            <AppBar
                position="fixed"
                color="primary"
                sx={{ top: "auto", bottom: 0 }}
            >
                <Toolbar
                    sx={{
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection:
                            focused || localComment.length !== 0
                                ? "column"
                                : "row",
                    }}
                >
                    <Grid width="100%" flexGrow={1} mb={1}>
                        <TextField
                            inputRef={commentInputRef}
                            sx={{ color: "#e6e9ec" }}
                            variant="standard"
                            focused={focused}
                            onFocus={() => setFocused(true)}
                            onBlur={() => {
                                setFocused(false);
                                setComment(localComment);
                            }}
                            disabled={shouldWritingBeDisabled}
                            fullWidth
                            multiline
                            helperText={
                                localComment.length > MAX_COMMENT_LENGTH
                                    ? "You have exceeded the maximum character limit"
                                    : undefined
                            }
                            error={
                                localComment.length > MAX_COMMENT_LENGTH
                                    ? true
                                    : undefined
                            }
                            value={localComment}
                            onChange={(
                                event: React.FocusEvent<HTMLInputElement>
                            ) => {
                                if (wasCommentSent) {
                                    setWasCommentSent(false);
                                }
                                setLocalComment(event.target.value);
                            }}
                            minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                            maxRows={20} //  https://stackoverflow.com/a/72789474/11046178c
                            required
                            id={`bottom-comment`}
                            placeholder="Leave your thoughts anonymously here"
                        />
                    </Grid>
                    <Grid
                        alignSelf={
                            focused || localComment.length !== 0
                                ? "flex-end"
                                : "inherit"
                        }
                        sx={{
                            display:
                                focused || localComment.length !== 0
                                    ? "inherit"
                                    : "none",
                        }}
                        container
                        justifyContent="flex-end"
                        alignItems="center"
                        direction="row"
                    >
                        <Grid
                            sx={{
                                mr: 3,
                                mb: 1,
                                display:
                                    localComment.length > MAX_COMMENT_LENGTH
                                        ? "inherit"
                                        : "none",
                            }}
                        >
                            <Typography variant="body2" color="error">
                                {MAX_COMMENT_LENGTH - localComment.length}
                            </Typography>
                        </Grid>
                        <Grid sx={{ mb: 1 }}>
                            <LoadingButton
                                loading={isSendingComment}
                                onClick={async () => await onSendComment()}
                                disabled={shouldSendingBeDisabled}
                            >
                                Post
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            {blocker.state === "blocked" ? (
                <DiscardDialog
                    onDiscard={() => {
                        setComment("");
                        setLocalComment("");
                        if (blocker.proceed !== undefined) {
                            blocker.proceed();
                        }
                    }}
                    onCancel={blocker.reset}
                />
            ) : null}
        </>
    );
}
