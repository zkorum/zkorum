import Grid from "@mui/material/Unstable_Grid2/Grid2";


interface PostProps {
  post: Post;
}

interface Post {
  id: number;
  title: string;
  type: number;
}

export function PostView(props: PostProps) {
  return (
    // lines
    <Grid container>
      {/* line 1 - group logo and other info */}
      <Grid container>{props.post.title}</Grid>
      {/* line 2 - poll/vote title */}
      <Grid>{props.post.type}</Grid>
      {/* line 3 - poll/vote type */}
      <Grid>{props.post.id}</Grid>
      {/* line 4 - tags */}
      <Grid></Grid>
      {/* line 5 - comments and view counts */}
      <Grid></Grid>
    </Grid>
  );
}
