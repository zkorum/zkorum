import { randomUUID } from "node:crypto";
import type { BaseLogger } from "pino";
import type { LogContext } from "@/shared-backend/logPrivacy.js";

type VoteBufferStage = NonNullable<LogContext["voteBufferStage"]>;

export function createVoteBufferProgress({
    log,
    stallWarningMs,
}: {
    log: Pick<BaseLogger, "info" | "warn">;
    stallWarningMs: number;
}) {
    const voteBufferFlushId = randomUUID();
    let current:
        | {
              stage: VoteBufferStage;
              startedAt: number;
              warning: NodeJS.Timeout;
          }
        | undefined;

    function context() {
        return current === undefined
            ? { voteBufferFlushId }
            : {
                  voteBufferFlushId,
                  voteBufferStage: current.stage,
                  durationMs: performance.now() - current.startedAt,
              };
    }

    function stop(): void {
        if (current !== undefined) clearTimeout(current.warning);
        current = undefined;
    }

    function completeStage(): void {
        if (current !== undefined && current.stage !== "fetch_votes") {
            log.info(
                { event: "vote_buffer", ...context() } satisfies LogContext,
                "[VoteBuffer] Stage completed",
            );
        }
        stop();
    }

    function enterStage(stage: VoteBufferStage): void {
        completeStage();
        const startedAt = performance.now();
        const warning = setTimeout(() => {
            log.warn(
                {
                    event: "vote_buffer",
                    voteBufferFlushId,
                    voteBufferStage: stage,
                    durationMs: performance.now() - startedAt,
                } satisfies LogContext,
                "[VoteBuffer] Stage is still pending",
            );
        }, stallWarningMs);
        warning.unref();
        current = { stage, startedAt, warning };
        // Empty queue polls are routine; only a slow or failed poll needs a log.
        if (stage !== "fetch_votes") {
            log.info(
                { event: "vote_buffer", ...context() } satisfies LogContext,
                "[VoteBuffer] Stage started",
            );
        }
    }

    return { enterStage, completeStage, stop, context };
}
