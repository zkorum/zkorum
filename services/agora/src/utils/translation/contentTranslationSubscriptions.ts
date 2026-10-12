import type { SupportedDisplayLanguageCodes } from "src/shared/languages";
import {
  buildContentTranslationTopic,
  buildProjectContentTranslationTopic,
  type SSEContentTranslationUpdatedData,
} from "src/shared/types/sse";
import { computed, shallowRef } from "vue";

export type ContentTranslationSubscription = Readonly<
  (
    | { kind: "conversation"; conversationSlugId: string }
    | { kind: "project"; projectSlug: string }
  ) & { targetLanguageCode: SupportedDisplayLanguageCodes }
>;

export function getContentTranslationSubscription({
  subject,
  targetLanguageCode,
}: {
  subject: SSEContentTranslationUpdatedData["subject"] | undefined;
  targetLanguageCode: SupportedDisplayLanguageCodes;
}): ContentTranslationSubscription | undefined {
  if (subject === undefined) {
    return undefined;
  }
  if (subject.kind === "project") {
    return {
      kind: "project",
      projectSlug: subject.projectSlug,
      targetLanguageCode,
    };
  }
  return {
    kind: "conversation",
    conversationSlugId: subject.conversationSlugId,
    targetLanguageCode,
  };
}

export function getContentTranslationTopic(
  subscription: ContentTranslationSubscription
): string {
  return subscription.kind === "project"
    ? buildProjectContentTranslationTopic(subscription)
    : buildContentTranslationTopic(subscription);
}

export function createContentTranslationSubscriptions() {
  const subscribersByTopic = new Map<string, Set<symbol>>();
  const topics = shallowRef<readonly string[]>([]);

  function retain(subscription: ContentTranslationSubscription): () => void {
    const topic = getContentTranslationTopic(subscription);
    const subscriber = Symbol();
    const subscribers = subscribersByTopic.get(topic) ?? new Set<symbol>();
    subscribers.add(subscriber);
    if (!subscribersByTopic.has(topic)) {
      subscribersByTopic.set(topic, subscribers);
      topics.value = [...subscribersByTopic.keys()];
    }

    return () => {
      if (!subscribers.delete(subscriber) || subscribers.size > 0) {
        return;
      }
      subscribersByTopic.delete(topic);
      topics.value = [...subscribersByTopic.keys()];
    };
  }

  return { topics: computed(() => topics.value), retain };
}

export const contentTranslationSubscriptions =
  createContentTranslationSubscriptions();
