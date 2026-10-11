import type {
    ConversationProjectTarget,
    ConversationProjectAssignment,
    ConversationProjectContext,
} from "../types/zod.js";

export function getConversationProjectTargetKey(
    target: ConversationProjectTarget,
): string {
    return target.kind === "project"
        ? `project:${target.projectSlug}`
        : `no_project:${target.organizationSlug}`;
}

export function getConversationProjectContextFromAssignment({
    assignment,
    conversationSlugId,
}: {
    assignment: ConversationProjectAssignment;
    conversationSlugId: string;
}): ConversationProjectContext | undefined {
    return assignment.target.kind === "project"
        ? {
              projectSlug: assignment.projectSlug,
              originalProjectTitle: assignment.projectTitle,
              conversationSlugId,
          }
        : undefined;
}
