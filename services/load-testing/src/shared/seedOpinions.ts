/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
export const MAX_SEED_OPINIONS_PER_SUBMISSION = 50;

export function getSeedOpinionComparisonKey(plainText: string): string {
    return plainText.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getDuplicateSeedOpinionIndexes({
    opinions,
    existingOpinions,
}: {
    opinions: readonly { index: number; plainText: string }[];
    existingOpinions: readonly string[];
}): number[] {
    const existingKeys = new Set(
        existingOpinions.map(getSeedOpinionComparisonKey),
    );
    const keys = opinions.map(({ index, plainText }) => ({
        index,
        key: getSeedOpinionComparisonKey(plainText),
    }));
    const counts = new Map<string, number>();
    for (const { key } of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
    return keys.flatMap(({ key, index }) =>
        existingKeys.has(key) || (counts.get(key) ?? 0) > 1 ? [index] : [],
    );
}
