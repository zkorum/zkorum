import { MAX_LENGTH_COMMENT } from "@/shared/shared";
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
    isLoggedIn: boolean;
    onLoggingIn: () => void;
    wasCommentSent: boolean;
    setWasCommentSent: (value: boolean) => void;
    focused: boolean;
    setFocused: (value: boolean) => void;
}

export function BottomAddCommentBar({
    setComment,
    isSendingComment,
    onSendComment,
    isContextNotLoaded,
    isLoggedIn,
    onLoggingIn,
    wasCommentSent,
    setWasCommentSent,
    focused,
    setFocused,
}: BottomAddCommentBarProps) {
    const inputRef = React.useRef<HTMLInputElement>();
    const [localComment, setLocalComment] = React.useState<string>("");

    React.useEffect(() => {
        if (focused) {
            const timeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            return () => {
                clearTimeout(timeout);
            };
        } else {
        }
    }, [focused]);

    const shouldSendingBeDisabled =
        localComment.length === 0 ||
        localComment.length > MAX_LENGTH_COMMENT ||
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
                onClick={isLoggedIn ? undefined : onLoggingIn}
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
                            inputRef={inputRef}
                            sx={{ color: "#e6e9ec" }}
                            variant="standard"
                            focused={focused}
                            onFocus={() => setFocused(true)}
                            onBlur={() => {
                                setFocused(false);
                                setComment(localComment);
                            }}
                            disabled={
                                isLoggedIn ? shouldWritingBeDisabled : false
                            }
                            fullWidth
                            multiline
                            helperText={
                                localComment.length > MAX_LENGTH_COMMENT
                                    ? "You have exceeded the maximum character limit"
                                    : undefined
                            }
                            error={
                                localComment.length > MAX_LENGTH_COMMENT
                                    ? true
                                    : undefined
                            }
                            value={localComment}
                            onChange={(
                                event: React.FocusEvent<HTMLInputElement>
                            ) => {
                                if (!isLoggedIn) {
                                    onLoggingIn();
                                } else {
                                    if (wasCommentSent) {
                                        setWasCommentSent(false);
                                    }
                                    setLocalComment(event.target.value);
                                }
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
                            display: isLoggedIn
                                ? focused || localComment.length !== 0
                                    ? "inherit"
                                    : "none"
                                : "inherit",
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
                                    localComment.length > MAX_LENGTH_COMMENT
                                        ? "inherit"
                                        : "none",
                            }}
                        >
                            <Typography variant="body2" color="error">
                                {MAX_LENGTH_COMMENT - localComment.length}
                            </Typography>
                        </Grid>
                        <Grid sx={{ mb: 1 }}>
                            <LoadingButton
                                loading={isSendingComment}
                                onClick={
                                    isLoggedIn
                                        ? async () => await onSendComment()
                                        : onLoggingIn
                                }
                                disabled={
                                    isLoggedIn ? shouldSendingBeDisabled : false
                                }
                            >
                                {isLoggedIn ? "Post" : "Log in"}
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
