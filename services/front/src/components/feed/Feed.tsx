import Box from "@mui/material/Box";
import { PostView, type Post } from "./PostView";
import { Divider } from "@mui/material";
import React from "react";
import { useAppDispatch } from "@/hooks";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";

export function Feed() {
    const [posts, setPosts] = React.useState<Array<Post>>([]);
    const dispatch = useAppDispatch();
    React.useEffect(() => {
        dispatch(openMainLoading());
        setPosts(fillPosts());
    }, []);
    React.useEffect(() => {
        if (posts.length !== 0) {
            dispatch(closeMainLoading());
        }
    }, [posts]);
    function fillPosts(): Array<Post> {
        const values = Array(100).fill({
            id: 1,
            title: "Do you feel safe on Campus ?",
            type: 2,
            viewNumber: 65,
            comments: Array(20).fill(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"
            ),
            description:
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            isEligible: true,
            expiredOn: "20/09/2023",
            participants: 593,
        });
        return values;
    }
    const indexLastPost = posts.length - 1;
    return (
        <Box sx={{ my: 2 }}>
            {posts.map((post, index) => {
                return (
                    <>
                        <PostView post={post} />
                        {indexLastPost === index ? null : <Divider />}
                    </>
                );
            })}
        </Box>
    );
}
