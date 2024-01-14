import { DefaultApiFactory } from "@/api";
import { noAuthAxios } from "@/interceptors";
import type { ExtendedPollData } from "@/shared/types/zod";

interface FetchFeedProps {
    showHidden: boolean;
    updatedAt: Date | undefined;
}

export async function fetchFeedMore({
    showHidden,
    updatedAt,
}: FetchFeedProps): Promise<ExtendedPollData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1FeedFetchMorePost({
        showHidden: showHidden,
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                },
                payload: value.payload,
                author: value.author,
                eligibility: value.eligibility,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}

export async function fetchFeedRecent({
    showHidden,
    updatedAt,
}: FetchFeedProps): Promise<ExtendedPollData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1FeedFetchRecentPost({
        showHidden: showHidden,
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                },
                payload: value.payload,
                author: value.author,
                eligibility: value.eligibility,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}
