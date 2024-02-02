import { DefaultApiFactory } from "@/api";
import { noAuthAxios } from "@/interceptors";
import type { ExtendedPostData } from "@/shared/types/zod";

interface FetchFeedProps {
    showHidden: boolean;
    lastReactedAt: Date | undefined;
}

export async function fetchFeedMore({
    showHidden,
    lastReactedAt,
}: FetchFeedProps): Promise<ExtendedPostData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1FeedFetchMorePost({
        showHidden: showHidden,
        lastReactedAt: lastReactedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                    lastReactedAt: new Date(value.metadata.lastReactedAt),
                    commentCount: value.metadata.commentCount,
                },
                payload: value.payload,
                author: value.author,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}

export async function fetchFeedRecent({
    showHidden,
    lastReactedAt,
}: FetchFeedProps): Promise<ExtendedPostData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1FeedFetchRecentPost({
        showHidden: showHidden,
        lastReactedAt: lastReactedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                    lastReactedAt: new Date(value.metadata.lastReactedAt),
                    commentCount: value.metadata.commentCount,
                },
                payload: value.payload,
                author: value.author,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}
