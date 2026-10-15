import { httpErrors } from "@fastify/sensible";
import type { GoogleCloudCredentials } from "@/shared-backend/googleCloudAuth.js";
import {
    resolveContentLanguageMetadata,
    type ContentLanguageDetectionInput,
    type ContentLanguageMetadata,
    type ContentLanguageMetadataResolver,
} from "./contentLanguageMetadata.js";

type ProviderInput = Omit<
    ContentLanguageDetectionInput,
    "useGoogleLanguageDetection"
>;
const PREPARATION_CONCURRENCY = 5;

export function createPreparedContentLanguageMetadata({
    googleCloudCredentials,
}: {
    googleCloudCredentials: GoogleCloudCredentials | undefined;
}) {
    const prepared = new Map<string, ContentLanguageMetadata>();
    function key(input: ProviderInput): string {
        return JSON.stringify([input.text, input.googleText ?? input.text]);
    }
    async function prepare(inputs: readonly ProviderInput[]): Promise<void> {
        if (googleCloudCredentials === undefined) return;
        const unique = [
            ...new Map(inputs.map((input) => [key(input), input])).values(),
        ];
        for (
            let offset = 0;
            offset < unique.length;
            offset += PREPARATION_CONCURRENCY
        ) {
            await Promise.all(
                unique
                    .slice(offset, offset + PREPARATION_CONCURRENCY)
                    .map(async (input) => {
                        const metadata = await resolveContentLanguageMetadata({
                            ...input,
                            googleCloudCredentials,
                            useGoogleLanguageDetection: true,
                        });
                        prepared.set(key(input), metadata);
                    }),
            );
        }
    }
    const resolve: ContentLanguageMetadataResolver = async (input) => {
        if (
            googleCloudCredentials === undefined ||
            !input.useGoogleLanguageDetection
        ) {
            // Lingua is local. This path cannot invoke an external provider.
            return await resolveContentLanguageMetadata({
                ...input,
                googleCloudCredentials: undefined,
            });
        }
        const metadata = prepared.get(key(input));
        if (metadata === undefined) {
            // A concurrent settings/content change introduced an unprepared corpus.
            // Abort the write transaction instead of making a provider call under locks.
            throw httpErrors.conflict(
                "Conversation changed during language preparation; retry the save",
            );
        }
        return metadata;
    };
    return { prepare, resolve };
}
