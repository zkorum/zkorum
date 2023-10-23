import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PublicIcon from "@mui/icons-material/Public";
import Grid from "@mui/material/Unstable_Grid2";
import Logo from "@/../public/logo-essec_72x107.af462b8d2b4c.png";
import Box from "@mui/material/Box";
import VerifiedIcon from "@mui/icons-material/Verified";
import { PollResultView, type Answer } from "./PollResultView";
import { CommentsViewsLikesView } from "./CommentsViewsLikesView";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import { faMask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeSvgIcon } from "../shared/FontAwesomeSvgIcon";

interface PostViewProps {
    post: Post;
}
export interface Post {
    id: number;
    lastUpdatedAt: string;
    isPublic: boolean;
    fromType: string;
    toType: string;
    title: string;
    type: number;
    isEligible: boolean;
    expireAt?: string;
    answers: Answer[];
    participants: number;
    description: string;
    viewCount: number;
    likeCount: number;
    comments: string[];
}

export function PostView(props: PostViewProps) {
    return (
        // lines
        <Paper elevation={0}>
            <Box sx={{ pt: 2, pb: 1, px: 2, my: 1 }}>
                <Grid container spacing={1} direction="column">
                    <Grid
                        container
                        spacing={2}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                    >
                        <Grid>
                            <Box
                                component="img"
                                sx={{
                                    height: 42,
                                }}
                                alt="ESSEC"
                                src={Logo}
                            />
                        </Grid>
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
                                                fontWeight: "bold",
                                                fontSize: 14,
                                            }}
                                            variant="body2"
                                        >
                                            ESSEC
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <VerifiedIcon
                                            sx={{ fontSize: 12 }}
                                            color="primary"
                                        />
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
                                            {props.post.lastUpdatedAt}
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
                                        {props.post.isPublic ? (
                                            <PublicIcon
                                                sx={{
                                                    color: "rgba(0, 0, 0, 0.6)",
                                                    fontSize: 12,
                                                }}
                                            />
                                        ) : (
                                            <LockPersonIcon
                                                sx={{
                                                    color: "rgba(0, 0, 0, 0.6)",
                                                    fontSize: 12,
                                                }}
                                            />
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid
                                sx={{ height: 20 }}
                                alignItems="center"
                                container
                                direction="row"
                                spacing={0.5}
                            >
                                <Grid
                                    container
                                    direction="row"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            From {props.post.fromType}
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <FontAwesomeSvgIcon
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            icon={faMask}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid
                                sx={{ height: 20 }}
                                alignItems="center"
                                justifyContent="center"
                                container
                                direction="row"
                                spacing={0.5}
                            >
                                <Grid>
                                    <Typography
                                        sx={{
                                            color: "rgba(0, 0, 0, 0.6)",
                                            fontSize: 12,
                                        }}
                                        variant="body2"
                                    >
                                        To {props.post.toType}
                                    </Typography>
                                </Grid>
                                {props.post.isEligible ? (
                                    <Chip
                                        sx={{
                                            fontSize: 10,
                                            height: 12,
                                        }}
                                        icon={
                                            <AdminPanelSettingsIcon
                                                sx={{ fontSize: 10 }}
                                                color="success"
                                            />
                                        }
                                        label="You are eligible"
                                        color="success"
                                    />
                                ) : null}
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            borderRadius: "8px",
                            my: 0.5,
                            border: "1px solid #e6e9ec",
                        }}
                    >
                        <Grid sx={{ p: 1 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "1.125rem",
                                    lineHeight: "1.5rem",
                                }}
                            >
                                {props.post.title}
                            </Typography>
                        </Grid>
                        {props.post.type === 2 ? (
                            <PollResultView
                                participants={props.post.participants}
                                answers={props.post.answers}
                                expireAt={props.post.expireAt}
                            />
                        ) : null}
                    </Grid>
                    <Grid sx={{ mt: 1 }}>
                        <CommentsViewsLikesView
                            commentCount={props.post.comments.length}
                            viewCount={props.post.viewCount}
                            likeCount={props.post.likeCount}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
}
