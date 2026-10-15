import { Dto } from "src/shared/types/dto";
import { getConversationProjectTargetKey } from "src/shared/utils/conversationProject";
import { describe, expect, it } from "vitest";

import {
  getEditConversationPostAsOptions,
  getEditConversationProjectSelectOptions,
} from "./editConversationProjectOptions";

type ConversationContext = Parameters<
  typeof getEditConversationProjectSelectOptions
>[0]["conversation"];

const emailUpdates = {
  canConfigure: false,
  hasParticipantContactEmail: false,
  scopeDefaultEnabled: false,
};
const project = ({ slug, owners }: { slug: string; owners: string[] }) =>
  Dto.conversationProjectOption.parse({
    target: { kind: "project", projectSlug: slug },
    title: slug,
    organizationSlugs: owners,
    premiumFeatures: [],
    defaultLanguageCode: "en",
    languageSettings: {
      dynamicTranslationEnabled: false,
      targetLanguageCodes: [],
    },
    emailUpdates,
  });
const defaultScope = (organizationSlug: string | undefined) =>
  Dto.conversationProjectOption.parse({
    target: { kind: "no_project", organizationSlug },
    premiumFeatures: [],
    emailUpdates,
  });

function createContext(): ConversationContext {
  return {
    currentProjectSlug: "current",
    projectTarget: { kind: "project", projectSlug: "current" },
    postAsOrganizationSlug: "owner",
    projectOptions: [
      defaultScope(undefined),
      defaultScope("owner"),
      defaultScope("other"),
      project({ slug: "current", owners: ["owner"] }),
      project({ slug: "other-project", owners: ["other"] }),
      project({ slug: "shared", owners: ["owner", "other"] }),
    ],
  };
}

describe("edit conversation project options", () => {
  it("distinguishes the personal target from an organization named personal", () => {
    expect(getConversationProjectTargetKey({ kind: "no_project" })).not.toBe(
      getConversationProjectTargetKey({
        kind: "no_project",
        organizationSlug: "personal",
      })
    );
  });

  it("offers exactly one default scope and only projects owned by the selected organization", () => {
    const options = getEditConversationProjectSelectOptions({
      conversation: createContext(),
      postAs: { postAsOrganization: true, organizationName: "owner" },
    });
    expect(options.map((option) => option.target)).toEqual([
      { kind: "no_project", organizationSlug: "owner" },
      { kind: "project", projectSlug: "current" },
      { kind: "project", projectSlug: "shared" },
    ]);
    for (const option of options) {
      expect(Dto.conversationProjectTarget.parse(option.target)).toEqual(
        option.target
      );
    }
  });

  it("includes a shared project under either owner without exposing the other owner's default scope", () => {
    const options = getEditConversationProjectSelectOptions({
      conversation: createContext(),
      postAs: { postAsOrganization: true, organizationName: "other" },
    });
    expect(options.map((option) => option.target)).toEqual([
      { kind: "no_project", organizationSlug: "other" },
      { kind: "project", projectSlug: "other-project" },
      { kind: "project", projectSlug: "shared" },
    ]);
  });

  it("shows only the personal default scope when posting as the user", () => {
    expect(
      getEditConversationProjectSelectOptions({
        conversation: createContext(),
        postAs: { postAsOrganization: false, organizationName: "" },
      })
    ).toEqual([
      { target: { kind: "no_project", organizationSlug: undefined } },
    ]);
  });

  it("preserves an existing assignment even when creation access has been revoked", () => {
    const conversation = createContext();
    conversation.projectOptions = [];
    expect(
      getEditConversationProjectSelectOptions({
        conversation,
        postAs: { postAsOrganization: true, organizationName: "owner" },
      })
    ).toEqual([{ target: conversation.projectTarget, title: "current" }]);
    expect(
      getEditConversationProjectSelectOptions({
        conversation,
        postAs: { postAsOrganization: true, organizationName: "other" },
      })
    ).toEqual([]);
  });

  it("deduplicates posting identities and includes an owner with project access but no default-scope access", () => {
    const conversation = createContext();
    conversation.projectOptions.push(
      project({ slug: "restricted", owners: ["project-only"] })
    );
    expect(getEditConversationPostAsOptions(conversation)).toEqual([
      { postAsOrganization: true, organizationName: "owner" },
      { postAsOrganization: false, organizationName: "" },
      { postAsOrganization: true, organizationName: "other" },
      { postAsOrganization: true, organizationName: "project-only" },
    ]);
    expect(
      getEditConversationProjectSelectOptions({
        conversation,
        postAs: { postAsOrganization: true, organizationName: "project-only" },
      })
    ).toEqual([
      {
        target: { kind: "project", projectSlug: "restricted" },
        title: "restricted",
      },
    ]);
  });
});
