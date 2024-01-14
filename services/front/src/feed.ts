import type {
    ExtendedPollData,
    ResponseToPollPayload,
} from "@/shared/types/zod";
import { fetchFeedMore, fetchFeedRecent } from "@/request/feed";
import { useOutletContext } from "react-router-dom";
import type { UpdatePostHiddenStatusProps } from "./RootDialog";

export type FeedContextType = {
    posts: PostsType;
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>;
    updatePost: (responseToPoll: ResponseToPollPayload) => void;
    updatePostHiddenStatus: (props: UpdatePostHiddenStatusProps) => void;
    loadingMore: boolean;
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
    loadingRecent: boolean;
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>;
};

export function usePostsAndMeta() {
    return useOutletContext<FeedContextType>();
}

// https://github.com/vitejs/vite-plugin-react-swc#consistent-components-exports
export type PostsType = ExtendedPollData[];

export async function doLoadMore(
    isAdmin: boolean,
    posts: ExtendedPollData[],
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>,
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>,
    lastIndex?: number
) {
    try {
        setLoadingMore(true);
        const lastPostUpdatedAt =
            lastIndex === undefined || lastIndex === 0
                ? undefined
                : posts[lastIndex].metadata.updatedAt;
        const newPosts = await fetchFeedMore({
            showHidden: isAdmin === true,
            updatedAt: lastPostUpdatedAt,
        });
        const actualNewPosts = newPosts.filter(
            (post) =>
                !posts.some(
                    (existingPost) =>
                        existingPost.metadata.uid === post.metadata.uid
                )
        );
        if (actualNewPosts.length !== 0) {
            setPosts((prevPosts) => [...prevPosts, ...actualNewPosts]);
        }
    } finally {
        setLoadingMore(false);
    }
}

export async function doLoadRecent(
    isAdmin: boolean,
    posts: ExtendedPollData[],
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>,
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>,
    minUpdatedAt: Date
) {
    try {
        setLoadingRecent(true);
        const newPosts = await fetchFeedRecent({
            showHidden: isAdmin === true,
            updatedAt: minUpdatedAt,
        });
        const actualNewPosts = newPosts.filter(
            (post) =>
                !posts.some(
                    (existingPost) =>
                        existingPost.metadata.uid === post.metadata.uid
                )
        );
        if (actualNewPosts.length !== 0) {
            setPosts((prevPosts) => [...actualNewPosts, ...prevPosts]);
        }
    } finally {
        setLoadingRecent(false);
    }
}
