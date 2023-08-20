import Grid from "@mui/material/Unstable_Grid2/Grid2";
interface Post<array> {
  title: string;
  type: number;
}

export function Post({ post: Post }) {
  return (
    // lines
    <Grid container>
      {/* line 1 - group logo and other info */}
      <Grid container>{post?.title}</Grid>
      {/* line 2 - poll/vote title */}
      <Grid>{post?.type}</Grid>
      {/* line 3 - poll/vote type */}
      <Grid>{post?.tags[0]}</Grid>
      {/* line 4 - tags */}
      <Grid></Grid>
      {/* line 5 - comments and view counts */}
      <Grid></Grid>
    </Grid>
  );
}
