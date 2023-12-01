import { DefaultApiFactory } from "@/api";
import { activeSessionUcanAxiosNoLog } from "@/interceptors";
import type { ExtendedPollData } from "@/shared/types/zod";

interface FetchFeedProps {
    updatedAt: Date | undefined;
}

export async function fetchFeedMore({
    updatedAt,
}: FetchFeedProps): Promise<ExtendedPollData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxiosNoLog // TODO <= use another UCAN
    ).apiV1FeedFetchMorePost({
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
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
    updatedAt,
}: FetchFeedProps): Promise<ExtendedPollData[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxiosNoLog // TODO <= use another UCAN
    ).apiV1FeedFetchRecentPost({
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data !== undefined) {
        return response.data.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
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
