import {
  type PreParticipationIntentionDialogTranslations,
  preParticipationIntentionDialogTranslations,
} from "src/components/authentication/intention/PreParticipationIntentionDialog.i18n";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { PossibleIntentions } from "src/stores/loginIntention";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

const messageKeys = {
  none: undefined,
  emailUpdates: undefined,
  settings: undefined,
  newOpinion: "subMessageStatementDraft",
  newConversation: "subMessageConversationDraft",
  agreement: "subMessageReturnToStatement",
  reportUserContent: "subMessageReportRequired",
  voting: "subMessageReturnToConversation",
} satisfies Record<
  PossibleIntentions,
  keyof PreParticipationIntentionDialogTranslations | undefined
>;

export function useParticipationIntentionMessage(
  intention: MaybeRefOrGetter<PossibleIntentions>
) {
  const { t } = useComponentI18n<PreParticipationIntentionDialogTranslations>(
    preParticipationIntentionDialogTranslations
  );
  return computed(() => {
    const key = messageKeys[toValue(intention)];
    return key === undefined ? undefined : t(key);
  });
}
