import type {
    ExtendedPostData,
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
export type PostsType = ExtendedPostData[];

export async function doLoadMore(
    isAdmin: boolean,
    posts: ExtendedPostData[],
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>,
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>,
    lastIndex?: number
) {
    try {
        setLoadingMore(true);
        const lastPostReactedAt =
            lastIndex === undefined || lastIndex === 0
                ? undefined
                : posts[lastIndex].metadata.lastReactedAt;
        const newPosts = await fetchFeedMore({
            showHidden: isAdmin === true,
            lastReactedAt: lastPostReactedAt,
        });
        if (lastPostReactedAt !== undefined) {
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
        } else {
            // refresh feed entirely
            setPosts(newPosts);
        }
    } finally {
        setLoadingMore(false);
    }
}

export async function doLoadRecent(
    isAdmin: boolean,
    posts: ExtendedPostData[],
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>,
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>,
    minLastReactedAt: Date
) {
    try {
        setLoadingRecent(true);
        const newPosts = await fetchFeedRecent({
            showHidden: isAdmin === true,
            lastReactedAt: minLastReactedAt,
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
