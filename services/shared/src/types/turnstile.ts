export const PHONE_SMS_TURNSTILE_ACTION = "phone_sms";
export const SEED_SUGGESTIONS_TURNSTILE_ACTION = "ai_seed_suggestions";

export type TurnstileAction =
    | typeof PHONE_SMS_TURNSTILE_ACTION
    | typeof SEED_SUGGESTIONS_TURNSTILE_ACTION;
