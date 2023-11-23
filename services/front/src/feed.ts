import type { ExtendedPollData } from "@/shared/types/zod";
import { fetchFeedMore, fetchFeedRecent } from "@/request/feed";
import { useOutletContext } from "react-router-dom";

export type ContextType = {
    posts: PostsType;
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>;
    loadingMore: boolean;
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
    loadingRecent: boolean;
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>;
};

export function usePostsAndMeta() {
    return useOutletContext<ContextType>();
}

// https://github.com/vitejs/vite-plugin-react-swc#consistent-components-exports
export type PostsType = ExtendedPollData[];

export async function doLoadMore(
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
            updatedAt: lastPostUpdatedAt,
        });
        if (newPosts.length !== 0) {
            setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        }
    } finally {
        setLoadingMore(false);
    }
}

export async function doLoadRecent(
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>,
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>,
    minUpdatedAt: Date
) {
    try {
        setLoadingRecent(true);
        const newPosts = await fetchFeedRecent({
            updatedAt: minUpdatedAt,
        });
        if (newPosts.length !== 0) {
            setPosts((prevPosts) => [...newPosts, ...prevPosts]);
        }
    } finally {
        setLoadingRecent(false);
    }
}
