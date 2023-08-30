import ApartmentIcon from '@mui/icons-material/Apartment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PublicIcon from '@mui/icons-material/Public';
import PollIcon from '@mui/icons-material/Poll';
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Grid } from '@mui/material';
interface PostProps {
  post: Post;
}

interface Post {
  id: number;
  title: string;
  type: number;
  isEligible: boolean;
  expiredOn: string;
  participants: number;
  description: string;
  viewNumber: number;
  comments: [];
}

export function PostView(props: PostProps) {
  return (
    // lines
    <Grid container spacing={2}>
      {/* line 1 - group logo and other info */}
      <Grid xs={2}><ApartmentIcon fontSize='large' /></Grid>
      <Grid xs={6} direction={"column"} >
        <span>{"ESSEC"}</span>
        <span>2h</span><PublicIcon />
      </Grid>
      <Grid xs={4}>{props.post.isEligible ? <AdminPanelSettingsIcon /> : null}</Grid>
      {/* line 2 - poll/vote title */}
      <Grid xs={12}>{props.post.title}</Grid>
      {/* line 3 - exerpt */}
      <Grid xs={12}>{props.post.description.slice(0, 60) + "..."}</Grid>
      {/* line 4 - poll/vote type */}
      <Grid xs={12}>{props.post.id}</Grid>
      {/* line 5 - tags */}
      <Grid xs={1}>{props.post.type === 2 ? <PollIcon /> : null}</Grid>
      <Grid xs={2}>{"60% No"}</Grid>
      <Grid xs={4}>{props.post.participants + " participants"}</Grid>
      <Grid xs={4}>{"open indefinitely"}</Grid>
      {/* line 6 - comments and view counts */}
      <Grid xs={6}><CommentIcon />{props.post.comments.length}</Grid>
      <Grid xs={6}><VisibilityIcon />{props.post.viewNumber}</Grid>
    </Grid>
  );
}
