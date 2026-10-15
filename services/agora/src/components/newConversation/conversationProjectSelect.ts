import type { ConversationProjectTarget } from "src/shared/types/zod";

export type ConversationProjectSelectOption =
  | {
      target: Extract<ConversationProjectTarget, { kind: "project" }>;
      title: string;
    }
  | {
      target: Extract<ConversationProjectTarget, { kind: "no_project" }>;
    };
