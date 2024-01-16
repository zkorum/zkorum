import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";

interface CommentsViewsLikesViewProps {
    commentCount: number;
    onComment: (event: React.MouseEvent<HTMLElement>) => void;
}

export function CommentsViewsLikesView({
    commentCount,
    onComment,
}: CommentsViewsLikesViewProps) {
    return (
        <Grid
            container
            direction="row"
            width="100%"
            justifyContent={"space-between"}
            alignItems="center"
        >
            <Button
                color="inherit"
                onMouseDown={(e) => e.preventDefault()} // https://stackoverflow.com/questions/15196352/prevent-onblur-code-to-execute-if-clicked-on-submit-button prevents onBlur from BottomAddCommentBar that would setCommentFocused to false... and then back to true!
                onClick={onComment}
                sx={{
                    textTransform: "none", // remove all caps
                    "&:hover": {
                        cursor: "pointer",
                    },
                }}
            >
                <Grid
                    container
                    justifyContent="center"
                    alignItems={"center"}
                    flexWrap={"wrap"}
                    direction="row"
                    spacing={1}
                    sx={{
                        p: 0.5,
                        // border: "1px solid #e6e9ec",
                        // borderRadius: "8px",
                    }}
                >
                    <CommentOutlinedIcon fontSize="small" />
                    <Grid>
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {commentCount === 1
                                ? `${commentCount} Comment`
                                : commentCount === 0
                                ? "Comment"
                                : `${commentCount} Comments`}
                        </Typography>
                    </Grid>
                </Grid>
            </Button>
        </Grid>
    );
}
