import { afterEach, describe, expect, it, vi } from "vitest";
import { createVoteBufferProgress } from "./voteBufferProgress.js";

afterEach(() => {
    vi.useRealTimers();
});

describe("vote buffer progress", () => {
    it("warns once for a stalled stage and retains its context", async () => {
        vi.useFakeTimers();
        const log = { info: vi.fn(), warn: vi.fn() };
        const progress = createVoteBufferProgress({
            log,
            stallWarningMs: 100,
        });
        progress.enterStage("begin_transaction");
        await vi.advanceTimersByTimeAsync(500);
        expect(log.warn).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                event: "vote_buffer",
                voteBufferStage: "begin_transaction",
                voteBufferFlushId: progress.context().voteBufferFlushId,
            }),
            "[VoteBuffer] Stage is still pending",
        );
        expect(progress.context().voteBufferStage).toBe("begin_transaction");
        progress.stop();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the previous stage warning on progress and on completion", async () => {
        vi.useFakeTimers();
        const log = { info: vi.fn(), warn: vi.fn() };
        const progress = createVoteBufferProgress({
            log,
            stallWarningMs: 100,
        });
        progress.enterStage("lock_conversations");
        await vi.advanceTimersByTimeAsync(90);
        progress.enterStage("recheck_votes");
        await vi.advanceTimersByTimeAsync(90);
        progress.completeStage();
        await vi.advanceTimersByTimeAsync(500);
        expect(log.warn).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("does not log routine empty-queue poll stages", () => {
        const log = { info: vi.fn(), warn: vi.fn() };
        const progress = createVoteBufferProgress({
            log,
            stallWarningMs: 100,
        });
        progress.enterStage("fetch_votes");
        progress.completeStage();
        expect(log.info).not.toHaveBeenCalled();
    });
});
