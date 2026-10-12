import { describe, expect, it } from "vitest";

import {
  type ContentTranslationSubscription,
  createContentTranslationSubscriptions,
  getContentTranslationSubscription,
} from "./contentTranslationSubscriptions";

const conversationSubscription = {
  kind: "conversation",
  conversationSlugId: "first",
  targetLanguageCode: "en",
} satisfies ContentTranslationSubscription;

describe("content translation subscriptions", () => {
  it("keeps a shared topic until its last subscriber releases it", () => {
    const subscriptions = createContentTranslationSubscriptions();
    const first = subscriptions.retain(conversationSubscription);
    const second = subscriptions.retain(conversationSubscription);
    const other = subscriptions.retain({
      kind: "project",
      projectSlug: "other",
      targetLanguageCode: "fr",
    });

    expect(subscriptions.topics.value).toEqual([
      "translation:conversation:first:target:en",
      "translation:project:other:target:fr",
    ]);
    first();
    first();
    expect(subscriptions.topics.value).toHaveLength(2);
    second();
    expect(subscriptions.topics.value).toEqual([
      "translation:project:other:target:fr",
    ]);
    other();
    expect(subscriptions.topics.value).toEqual([]);
  });

  it("does not release a new subscription when an old cleanup runs again", () => {
    const subscriptions = createContentTranslationSubscriptions();
    const topic = "translation:conversation:first:target:en";
    const oldRelease = subscriptions.retain(conversationSubscription);
    oldRelease();
    const newRelease = subscriptions.retain(conversationSubscription);
    oldRelease();
    expect(subscriptions.topics.value).toEqual([topic]);
    newRelease();
    expect(subscriptions.topics.value).toEqual([]);
  });

  it("uses the subject's conversation or project and requested language", () => {
    const sourceVersion = "00000000-0000-4000-8000-000000000001";
    expect(
      getContentTranslationSubscription({
        subject: {
          kind: "opinion",
          conversationSlugId: "conversation",
          opinionSlugId: "opinion",
          sourceVersion,
        },
        targetLanguageCode: "en",
      })
    ).toEqual({
      kind: "conversation",
      conversationSlugId: "conversation",
      targetLanguageCode: "en",
    });
    expect(
      getContentTranslationSubscription({
        subject: { kind: "project", projectSlug: "project", sourceVersion },
        targetLanguageCode: "fr",
      })
    ).toEqual({
      kind: "project",
      projectSlug: "project",
      targetLanguageCode: "fr",
    });
    expect(
      getContentTranslationSubscription({
        subject: undefined,
        targetLanguageCode: "en",
      })
    ).toBeUndefined();
  });
});
