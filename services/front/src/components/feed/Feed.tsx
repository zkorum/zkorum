import Box from "@mui/material/Box";
import { PostView, type Post } from "./PostView";
import React from "react";
import { useAppDispatch } from "@/hooks";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import Container from "@mui/material/Container";

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
        const firstPost = {
            id: 1,
            lastUpdatedAt: "2h",
            title: "How often do you hang out with people from other cultures?",
            type: 2,
            isPublic: true,
            fromType: "a student",
            toType: "every members",
            viewCount: 2045,
            likeCount: 504,
            comments: Array(208).fill(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"
            ),
            description:
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            isEligible: true,
            expireAt: "2023/12/01",
            participants: 593,
            answers: [
                { response: "Rarely", percentage: 63 },
                { response: "Sometimes", percentage: 24 },
                { response: "Often", percentage: 13 },
            ],
        };
        const secondPost = {
            id: 2,
            lastUpdatedAt: "12h",
            title: "Do you use ChatGPT to write essays?",
            type: 2,
            isPublic: false,
            fromType: "a staff member",
            toType: "students",
            viewCount: 1548,
            likeCount: 213,
            comments: Array(154).fill(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"
            ),
            description:
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            isEligible: true,
            expireAt: undefined,
            participants: 593,
            answers: [
                { response: "Yes", percentage: 78 },
                { response: "No", percentage: 22 },
            ],
        };
        const thirdPost = {
            id: 3,
            lastUpdatedAt: "1d",
            title: "How much is your starting salary right after ESSEC?",
            type: 2,
            isPublic: false,
            fromType: "an MiM student",
            toType: "MiM alumni",
            viewCount: 1074,
            likeCount: 34,
            comments: Array(20).fill(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"
            ),
            description:
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            isEligible: false,
            expireAt: undefined,
            participants: 593,
            answers: [
                { response: "Between 38K and 45K", percentage: 58 },
                { response: "Between 45K and 55K", percentage: 31 },
                { response: "Above 55K", percentage: 6 },
                { response: "Below 38K", percentage: 5 },
            ],
        };
        const fourthPost = {
            id: 4,
            lastUpdatedAt: "15m",
            title: "Is ChatGPT a friend or foe for education?",
            type: 2,
            isPublic: true,
            fromType: "a faculty member",
            toType: "faculty and staff members",
            viewCount: 547,
            likeCount: 8,
            comments: Array(10).fill(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book"
            ),
            description:
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            isEligible: false,
            expireAt: undefined,
            participants: 593,
            answers: [
                { response: "Foe", percentage: 49 },
                { response: "Friend", percentage: 41 },
                { response: "Not sure", percentage: 10 },
            ],
        };
        return [firstPost, secondPost, thirdPost, fourthPost];
    }
    return (
        <Container maxWidth="sm" disableGutters>
            <Box>
                {posts.map((post) => {
                    return (
                        <>
                            <PostView post={post} />
                        </>
                    );
                })}
            </Box>
        </Container>
    );
}
