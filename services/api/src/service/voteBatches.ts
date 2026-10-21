// Bound lock scope and SQL shape independently of the shared queue fetch size.
const MAX_VOTES_PER_TRANSACTION = 500;

export function partitionVoteBatches<T extends { conversationId: number }>(
    votes: readonly T[],
): { conversationId: number; votes: T[] }[] {
    const byConversation = new Map<number, T[]>();
    for (const vote of votes) {
        const conversationVotes = byConversation.get(vote.conversationId) ?? [];
        conversationVotes.push(vote);
        byConversation.set(vote.conversationId, conversationVotes);
    }
    const batches: { conversationId: number; votes: T[] }[] = [];
    for (
        let offset = 0;
        byConversation.size > 0;
        offset += MAX_VOTES_PER_TRANSACTION
    ) {
        for (const [conversationId, conversationVotes] of byConversation) {
            batches.push({
                conversationId,
                votes: conversationVotes.slice(
                    offset,
                    offset + MAX_VOTES_PER_TRANSACTION,
                ),
            });
            if (
                offset + MAX_VOTES_PER_TRANSACTION >=
                conversationVotes.length
            ) {
                byConversation.delete(conversationId);
            }
        }
    }
    return batches;
}
