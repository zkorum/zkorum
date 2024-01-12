import { DefaultApiFactory } from "@/api";
import { activeSessionUcanAxios } from "@/interceptors";

interface ModeratePostProps {
    pollUid: string;
}

interface ModerateCommentProps {
    commentSlugId: string;
}

export async function hidePost({ pollUid }: ModeratePostProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationHidePostPost({
        pollUid: pollUid,
    });
}

export async function unhidePost({ pollUid }: ModeratePostProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationUnhidePostPost({
        pollUid: pollUid,
    });
}

export async function hideComment({ commentSlugId }: ModerateCommentProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationHideCommentPost({
        commentSlugId: commentSlugId,
    });
}

export async function unhideComment({ commentSlugId }: ModerateCommentProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationUnhideCommentPost({
        commentSlugId: commentSlugId,
    });
}
