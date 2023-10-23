import { Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

interface CommentsViewsLikesViewProps {
    viewCount: number;
    commentCount: number;
    likeCount: number;
}

export function CommentsViewsLikesView({
    viewCount,
    commentCount,
    likeCount,
}: CommentsViewsLikesViewProps) {
    return (
        <Grid
            container
            direction="row"
            width="100%"
            justifyContent={"space-between"}
            alignItems="center"
        >
            <Grid
                container
                justifyContent="center"
                flexWrap={"wrap"}
                spacing={0.5}
            >
                <Grid>
                    <FavoriteBorderOutlinedIcon fontSize="small" />
                </Grid>
                <Grid>
                    <Typography
                        variant="body2"
                        sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                    >
                        {likeCount}
                    </Typography>
                </Grid>
            </Grid>
            <Grid>
                <Grid
                    container
                    justifyContent="center"
                    flexWrap={"wrap"}
                    spacing={0.5}
                >
                    <Grid>
                        <CommentOutlinedIcon fontSize="small" />
                    </Grid>
                    <Grid>
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {commentCount}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid>
                <Grid
                    container
                    justifyContent="center"
                    flexWrap={"wrap"}
                    spacing={0.5}
                >
                    <Grid>
                        <VisibilityOutlinedIcon fontSize="small" />
                    </Grid>
                    <Grid>
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {viewCount}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}
