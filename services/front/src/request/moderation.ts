import { DefaultApiFactory } from "@/api";
import { activeSessionUcanAxios } from "@/interceptors";

interface ModerateContentProps {
    pollUid: string;
}

export async function hideContent({ pollUid }: ModerateContentProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationHidePost({
        pollUid: pollUid,
    });
}

export async function unhideContent({ pollUid }: ModerateContentProps) {
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1ModerationUnhidePost({
        pollUid: pollUid,
    });
}
