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
        : target.organizationSlug === undefined
          ? "personal:no_project"
          : `no_project:${target.organizationSlug}`;
}

export function getConversationProjectContextFromAssignment({
    assignment,
    conversationSlugId,
    currentContext,
}: {
    assignment: ConversationProjectAssignment;
    conversationSlugId: string;
    currentContext?: ConversationProjectContext;
}): ConversationProjectContext | undefined {
    if (
        assignment.target.kind === "project" &&
        currentContext?.projectSlug === assignment.projectSlug &&
        currentContext.originalProjectTitle === assignment.projectTitle
    )
        return currentContext;
    return assignment.target.kind === "project"
        ? {
              projectSlug: assignment.projectSlug,
              originalProjectTitle: assignment.projectTitle,
              conversationSlugId,
          }
        : undefined;
}
