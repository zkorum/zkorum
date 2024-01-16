import { useOutletContext } from "react-router-dom";
import type { UpdatePostHiddenStatusProps } from "./RootDialog";
import type {
    ExtendedPollData,
    PostComment,
    ResponseToPollPayload,
} from "./shared/types/zod";

export type PostContextType = {
    postSlugId: string;
    post?: ExtendedPollData;
    postHasError: boolean;
    comments: PostComment[];
    setComments: React.Dispatch<React.SetStateAction<PostComment[]>>;
    updatePost: (responseToPoll: ResponseToPollPayload) => void;
    updatePostHiddenStatus: (props: UpdatePostHiddenStatusProps) => void;
    wasCommentSent: boolean;
    commentFocused: boolean;
    setCommentFocused: (value: boolean) => void;
};

export function usePost() {
    return useOutletContext<PostContextType>();
}
