import Box from "@mui/material/Box";
import { PostView } from "./PostView";
import { Divider } from "@mui/material";

export function Dashboard() {
  const posts = [{id: 1, title: "Post 1", type: 2}, {id: 2, title: "Post 2", type: 1}]
  const indexLastPost = posts.length - 1
  console
  return (
    <Box sx={{ my: 2 }}>
      {posts.map((post, index) => {
        return <>
        <PostView post={post}/>
        {indexLastPost === index ? null : <Divider />
        }</>
      })}
    </Box>
  );
}
