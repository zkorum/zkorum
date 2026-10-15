import { describe, expect, it } from "vitest";
import {
    authorizeConversationTranslationEdit,
    type ConversationTranslationEditAccess,
    type ConversationTranslationSelection,
} from "./conversationTranslationEdit.js";
import type { ConversationMultilingualSettings } from "./translationLanguageSetting.js";

const paidSettings: ConversationMultilingualSettings = {
    dynamicTranslationEnabled: true,
    additionalLanguageCodes: ["fr", "es"],
};
const existingAccess: ConversationTranslationEditAccess = {
    kind: "retain_existing",
    current: {
        source: "conversation_override",
        dynamicTranslationEnabled: true,
        effectiveTargetLanguageCodes: ["en", "fr", "es"],
        primaryLanguageCode: "en",
    },
};

function overrideSelection(
    multilingualSetting: ConversationMultilingualSettings,
): ConversationTranslationSelection {
    return { source: "conversation_override", multilingualSetting };
}

describe("conversation translation edit authorization", () => {
    it("allows reducing an expired configuration without authorizing paid work", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: existingAccess,
                requested: overrideSelection({
                    dynamicTranslationEnabled: false,
                    additionalLanguageCodes: ["fr"],
                }),
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
    });

    it.each([
        { dynamicTranslationEnabled: true, additionalLanguageCodes: ["fr"] },
        {
            dynamicTranslationEnabled: false,
            additionalLanguageCodes: ["fr", "es"],
        },
    ] satisfies ConversationMultilingualSettings[])(
        "rejects expanding an expired configuration: %j",
        (settings) => {
            expect(
                authorizeConversationTranslationEdit({
                    access: {
                        kind: "retain_existing",
                        current: {
                            source: "conversation_override",
                            dynamicTranslationEnabled: false,
                            effectiveTargetLanguageCodes: ["en", "fr"],
                            primaryLanguageCode: "en",
                        },
                    },
                    requested: overrideSelection(settings),
                }),
            ).toEqual({ success: false, reason: "premium_access_required" });
        },
    );

    it("preserves unchanged settings regardless of order without authorizing paid work", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: existingAccess,
                requested: overrideSelection({
                    ...paidSettings,
                    additionalLanguageCodes: ["es", "fr"],
                }),
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
    });

    it.each([
        existingAccess,
        { kind: "disabled_only" },
    ] satisfies ConversationTranslationEditAccess[])(
        "allows disabling premium settings with %j",
        (access) => {
            expect(
                authorizeConversationTranslationEdit({
                    access,
                    requested: overrideSelection({
                        dynamicTranslationEnabled: false,
                        additionalLanguageCodes: [],
                    }),
                }),
            ).toEqual({ success: true, translationWorkEnabled: false });
        },
    );

    it("does not grandfather premium settings into a destination without access", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: { kind: "disabled_only" },
                requested: overrideSelection(paidSettings),
            }),
        ).toEqual({ success: false, reason: "premium_access_required" });
    });

    it("does not grandfather inherited targets into a conversation override", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: {
                    ...existingAccess,
                    current: {
                        ...existingAccess.current,
                        source: "project_inherited",
                    },
                },
                requested: overrideSelection(paidSettings),
            }),
        ).toEqual({ success: false, reason: "premium_access_required" });
    });

    it("does not mistake the automatic primary language for an existing manual target", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: existingAccess,
                requested: overrideSelection({
                    dynamicTranslationEnabled: false,
                    additionalLanguageCodes: ["en"],
                }),
            }),
        ).toEqual({ success: false, reason: "premium_access_required" });
    });

    it("does not treat the inherited primary language as manual configuration", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: { kind: "disabled_only" },
                requested: {
                    source: "project_inherited",
                    projectLanguageSettings: {
                        defaultLanguageCode: "en",
                        targetLanguageCodes: [],
                        dynamicTranslationEnabled: false,
                    },
                },
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
    });

    it("compares complete inherited target sets without truncating them", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: {
                    kind: "retain_existing",
                    current: {
                        source: "project_inherited",
                        dynamicTranslationEnabled: true,
                        primaryLanguageCode: "en",
                        effectiveTargetLanguageCodes: ["en", "fr", "es", "ar"],
                    },
                },
                requested: {
                    source: "project_inherited",
                    projectLanguageSettings: {
                        defaultLanguageCode: "en",
                        dynamicTranslationEnabled: true,
                        targetLanguageCodes: ["fr", "es", "ar"],
                    },
                },
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
    });

    it("preserves inherited configuration that explicitly repeats its primary language", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: {
                    kind: "retain_existing",
                    current: {
                        source: "project_inherited",
                        dynamicTranslationEnabled: true,
                        primaryLanguageCode: "en",
                        effectiveTargetLanguageCodes: ["en", "fr"],
                    },
                },
                requested: {
                    source: "project_inherited",
                    projectLanguageSettings: {
                        defaultLanguageCode: "en",
                        dynamicTranslationEnabled: true,
                        targetLanguageCodes: ["en", "fr"],
                    },
                },
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
    });

    it("authorizes new paid configuration and work with destination access", () => {
        expect(
            authorizeConversationTranslationEdit({
                access: { kind: "configure" },
                requested: overrideSelection(paidSettings),
            }),
        ).toEqual({ success: true, translationWorkEnabled: true });
    });

    it("does not mutate or normalize the requested settings during authorization", () => {
        const multilingualSetting = Object.freeze({
            dynamicTranslationEnabled: true,
            additionalLanguageCodes: ["es", "fr"],
        } satisfies ConversationMultilingualSettings);
        const requested = overrideSelection(multilingualSetting);
        expect(
            authorizeConversationTranslationEdit({
                access: existingAccess,
                requested,
            }),
        ).toEqual({ success: true, translationWorkEnabled: false });
        expect(multilingualSetting.additionalLanguageCodes).toEqual([
            "es",
            "fr",
        ]);
    });
});
