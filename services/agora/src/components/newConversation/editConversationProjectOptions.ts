import type { PostAsSettings } from "src/composables/conversation/draft";
import type { GetConversationForEditResponse } from "src/shared/types/dto";
import { getConversationProjectTargetKey } from "src/shared/utils/conversationProject";

import type { ConversationProjectSelectOption } from "./conversationProjectSelect";

type EditableConversation = Extract<
  GetConversationForEditResponse,
  { success: true }
>;
type ConversationProjectContext = Pick<
  EditableConversation,
  | "projectOptions"
  | "projectTarget"
  | "postAsOrganizationSlug"
  | "projectLanguageProject"
  | "currentProjectSlug"
>;

export function getEditConversationPostAsOptions(
  conversation: ConversationProjectContext
): PostAsSettings[] {
  const identities = new Map<string | undefined, PostAsSettings>();
  const addIdentity = (organizationSlug: string | undefined): void => {
    identities.set(organizationSlug, {
      postAsOrganization: organizationSlug !== undefined,
      organizationName: organizationSlug ?? "",
    });
  };
  addIdentity(conversation.postAsOrganizationSlug);
  for (const option of conversation.projectOptions) {
    if ("organizationSlugs" in option) {
      for (const slug of option.organizationSlugs) addIdentity(slug);
    } else {
      addIdentity(option.target.organizationSlug);
    }
  }
  return [...identities.values()];
}

export function getEditConversationProjectSelectOptions({
  conversation,
  postAs,
}: {
  conversation: ConversationProjectContext;
  postAs: PostAsSettings;
}): ConversationProjectSelectOption[] {
  const organizationSlug = postAs.postAsOrganization
    ? postAs.organizationName
    : undefined;
  const options = conversation.projectOptions
    .filter((option) =>
      "organizationSlugs" in option
        ? organizationSlug !== undefined &&
          option.organizationSlugs.includes(organizationSlug)
        : option.target.organizationSlug === organizationSlug
    )
    .map<ConversationProjectSelectOption>((option) =>
      "organizationSlugs" in option
        ? { target: option.target, title: option.title }
        : { target: option.target }
    );
  if (
    organizationSlug === conversation.postAsOrganizationSlug &&
    !options.some(
      (option) =>
        getConversationProjectTargetKey(option.target) ===
        getConversationProjectTargetKey(conversation.projectTarget)
    )
  ) {
    options.unshift(
      conversation.projectTarget.kind === "project"
        ? {
            target: conversation.projectTarget,
            title:
              conversation.projectLanguageProject?.projectTitle ??
              conversation.currentProjectSlug,
          }
        : { target: conversation.projectTarget }
    );
  }
  return options;
}
