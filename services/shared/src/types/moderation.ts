// shared/src/types/moderation.ts

import { z } from "zod";

// Define the allowed moderation actions
export const moderationActionEnum = z.enum(['hide', 'unhide', 'delete', 'warn', 'ban']);
export type ModerationAction = z.infer<typeof moderationActionEnum>;

// Define the allowed moderation reasons
export const moderationReasonEnum = z.enum(['spam', 'harassment', 'inappropriate_content', 'hate_speech', 'other']);
export type ModerationReason = z.infer<typeof moderationReasonEnum>;