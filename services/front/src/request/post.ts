import {
    DefaultApiFactory,
    type ApiV1CommentCreatePostRequestPayload,
} from "@/api";
import { noAuthAxios } from "@/interceptors";
import type { PostFetch200 } from "@/shared/types/dto";
import type {
    ExtendedPostData,
    Post,
    PostComment,
    PostSlugId,
    ResponseToPollPayload,
} from "@/shared/types/zod";
import { insertOrUpdateResponseToPoll } from "@/store/reducers/session";
import { store } from "@/store/store";
import type { Presentation } from "@docknetwork/crypto-wasm-ts";

interface FetchCommentsProps {
    postSlugId: PostSlugId;
    updatedAt?: Date | undefined;
}

export async function createPost(
    presentation: Presentation,
    postContent: Post
): Promise<void> {
    // const bearerToken = encodeCbor(presentation.toJSON());
    // console.log(
    //     presentation.toJSON(),
    //     bearerToken,
    //     new Blob([bearerToken]).size
    // );
    await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1PostCreatePost({
        post: postContent,
        pres: presentation.toJSON(),
    });
}

export async function doRespondToPoll(
    presentation: Presentation,
    responseToPoll: ResponseToPollPayload,
    updatePost: (responseToPoll: ResponseToPollPayload) => void
): Promise<void> {
    const generatedPseudonym =
        presentation.spec.boundedPseudonyms === undefined
            ? undefined
            : Object.keys(presentation.spec.boundedPseudonyms)[0];
    if (generatedPseudonym === undefined) {
        throw new Error("Pseudonym was not generated in the proof");
    }
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1PollRespondPost({
        responseToPoll: responseToPoll,
        pres: presentation.toJSON(),
    });
    if (response.status >= 200 && response.status <= 299) {
        // update local DB with the presentation
        store.dispatch(
            insertOrUpdateResponseToPoll({
                respondentPseudonym: generatedPseudonym,
                responsePayload: responseToPoll,
            })
        );
        updatePost(responseToPoll);
    }
}

export async function createComment(
    presentation: Presentation,
    createCommentPayload: ApiV1CommentCreatePostRequestPayload
): Promise<void> {
    // const bearerToken = encodeCbor(presentation.toJSON());
    // console.log(
    //     presentation.toJSON(),
    //     bearerToken,
    //     new Blob([bearerToken]).size
    // );
    await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1CommentCreatePost({
        pres: presentation.toJSON(),
        payload: createCommentPayload,
    });
}

export async function fetchPost(postSlugId: PostSlugId): Promise<PostFetch200> {
    // const bearerToken = encodeCbor(presentation.toJSON());
    // console.log(
    //     presentation.toJSON(),
    //     bearerToken,
    //     new Blob([bearerToken]).size
    // );
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1PostFetchPost({
        postSlugId: postSlugId,
    });
    const postResponse = response.data.post;
    const commentsResponse = response.data.comments;
    const post: ExtendedPostData = {
        metadata: {
            uid: postResponse.metadata.uid,
            slugId: postResponse.metadata.slugId,
            isHidden: postResponse.metadata.isHidden,
            updatedAt: new Date(postResponse.metadata.updatedAt),
            lastReactedAt: new Date(postResponse.metadata.lastReactedAt),
            commentCount: postResponse.metadata.commentCount,
        },
        payload: postResponse.payload,
        author: postResponse.author,
    };
    const comments = commentsResponse.map((comment) => {
        return {
            metadata: {
                uid: comment.metadata.uid,
                slugId: comment.metadata.slugId,
                isHidden: comment.metadata.isHidden,
                updatedAt: new Date(comment.metadata.updatedAt),
            },
            content: comment.content,
            author: comment.author,
        };
    });
    return { post, comments };
}

export async function fetchMoreComments({
    updatedAt,
    postSlugId,
}: FetchCommentsProps): Promise<PostComment[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1CommentFetchMorePost({
        postSlugId: postSlugId,
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data?.comments !== undefined) {
        return response.data.comments.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                },
                content: value.content,
                author: value.author,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}

export async function fetchRecentComments({
    updatedAt,
    postSlugId,
}: FetchCommentsProps): Promise<PostComment[]> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1CommentFetchRecentPost({
        postSlugId: postSlugId,
        updatedAt: updatedAt?.toISOString(),
    });
    if (response.data?.comments !== undefined) {
        return response.data.comments.map((value) => {
            return {
                metadata: {
                    uid: value.metadata.uid,
                    slugId: value.metadata.slugId,
                    isHidden: value.metadata.isHidden,
                    updatedAt: new Date(value.metadata.updatedAt),
                },
                content: value.content,
                author: value.author,
            };
        });
    } else {
        console.warn("No data fetched");
        return [];
    }
}
