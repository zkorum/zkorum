/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
import { htmlToCountedText, validateRichTextInput } from "../richText.js";
import { normalizeUserRichTextHtml } from "../richTextHtml.js";
import { getDuplicateSeedOpinionIndexes } from "../seedOpinions.js";
import { validateRichTextHtmlByteCount } from "../shared.js";
import type { SeedOpinionValidationFailure } from "../types/dto.js";

export function validateSeedOpinionAdditions({
    opinions,
    existingOpinions,
}: {
    opinions: readonly string[];
    existingOpinions: readonly string[];
}): SeedOpinionValidationFailure[] {
    const results = opinions.map((htmlString) => {
        const htmlSize = validateRichTextHtmlByteCount({
            htmlString,
            mode: "opinion",
        });
        if (!htmlSize.success) return htmlSize;
        return validateRichTextInput({
            htmlString: normalizeUserRichTextHtml(htmlString),
            mode: "opinion",
        });
    });
    const duplicateIndexes = new Set(
        getDuplicateSeedOpinionIndexes({
            opinions: results.flatMap((result, index) =>
                result.success ? [{ index, plainText: result.plainText }] : [],
            ),
            existingOpinions: existingOpinions.map(htmlToCountedText),
        }),
    );
    const failures: SeedOpinionValidationFailure[] = [];
    for (const [index, result] of results.entries()) {
        if (!result.success) {
            failures.push({
                index,
                reason: result.reason,
                count: result.count,
                limit: result.limit,
            });
        } else {
            if (duplicateIndexes.has(index)) {
                failures.push({ index, reason: "duplicate" });
            }
        }
    }
    return failures;
}
