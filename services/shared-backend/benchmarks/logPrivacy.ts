import { Session } from "node:inspector/promises";
import { cpus, platform, arch } from "node:os";
import { performance } from "node:perf_hooks";
import type { HeapProfiler } from "node:inspector";
import pino, { type Logger } from "pino";
import Fastify from "fastify";
import { createApiLogPrivacy } from "../../api/src/logging/privacy.js";
import { createStructuredLogger } from "../../conversation-email-update-worker/src/logger.js";

// This development-only harness uses synthetic inputs and a counting sink. It
// measures logger CPU/GC costs independently of disk, network, and pretty output.
const sourceRoot = new URL("../../api/src/", import.meta.url);
const warmupOperations = 2_000;
const timingBatches = 40;
const operationsPerBatch = 250;
const allocationOperations = 5_000;

interface Scenario {
    name: string;
    create: () => Logger;
    run: (logger: Logger) => void;
}

let outputCharacters = 0;
const destination = {
    write(line: string): void {
        outputCharacters += line.length;
    },
};

const apiPrivacy = createApiLogPrivacy(sourceRoot);
const routes = Fastify();
apiPrivacy.registerRoutes(routes);
routes.post("/api/v1/benchmark/:token", () => Promise.resolve({ ok: true }));

const metadata = { event: "application_event", count: 4, durationMs: 12 };
const request = {
    method: "POST",
    routeOptions: { url: "/api/v1/benchmark/:token" },
    url: "/api/v1/benchmark/private-capability?token=private-query",
    headers: { authorization: "Bearer private-token" },
    body: { email: "synthetic@example.invalid" },
    ip: "203.0.113.7",
};
const providerError = Object.assign(
    new Error("Synthetic private provider body"),
    {
        name: "AxiosError",
        code: "ERR_BAD_RESPONSE",
        status: 503,
        config: {
            headers: { authorization: "Bearer private-token" },
            data: "synthetic@example.invalid",
        },
    },
);
providerError.stack = `AxiosError: Synthetic private provider body\n    at send (${new URL("service/email.ts", sourceRoot).href}:12:3)`;
const lateWorkerEvent = {
    event: "worker_started",
    outcome: "started",
    sendingEnabled: true,
    killSwitch: false,
    provider: "simulated",
    heartbeatIntervalMs: 60_000,
};
const performanceEvent = JSON.stringify({
    schemaVersion: 1,
    timestamp: "2026-10-09T00:00:00.000Z",
    scenario: "solidago-ranking",
    phase: "api",
    action: "request_completed",
    outcome: "success",
    conversationSlugId: "convo001",
    responseTimeMs: 42,
    metadata: { requestId: "req-1", operation: "save", transaction: 20 },
});

const bare = (): Logger =>
    pino({ level: "info", base: undefined }, destination);
const api = (): Logger =>
    pino({ level: "info", ...apiPrivacy.options }, destination);
const worker = (): Logger =>
    createStructuredLogger({
        environment: "test",
        workerId: "worker-benchmark",
        level: "info",
        destination,
    });
const writeMetadata = (logger: Logger): void => {
    logger.info(metadata, "Application event");
};
const writeRequest = (logger: Logger): void => {
    logger.info(
        {
            reqId: "req-1",
            req: request,
            res: { statusCode: 200 },
            responseTime: 12,
        },
        "request completed",
    );
};
const writeError = (logger: Logger): void => {
    logger.error(providerError, "Email deliverability check failed");
};
const writeChild = (logger: Logger): void => {
    logger
        .child({ reqId: "req-1", email: "synthetic@example.invalid" })
        .info(metadata, "Application event");
};
const writeWorkerEvent = (logger: Logger): void => {
    logger.info(lateWorkerEvent);
};
const writePerformance = (logger: Logger): void => {
    logger.info("AGORA_LOAD_EVENT %s", performanceEvent);
};

// The no-write-hook variant is a diagnostic lower bound, not a privacy-safe
// configuration: child bindings can bypass it. Never deploy this variant.
const apiWithoutFinalProjection = (): Logger => {
    const options = apiPrivacy.options;
    return pino(
        {
            ...options,
            level: "info",
            hooks: { logMethod: options.hooks.logMethod },
        },
        destination,
    );
};
const scenarios: Scenario[] = [
    { name: "bare metadata", create: bare, run: writeMetadata },
    { name: "api metadata", create: api, run: writeMetadata },
    {
        name: "api metadata without final projection (unsafe diagnostic)",
        create: apiWithoutFinalProjection,
        run: writeMetadata,
    },
    { name: "bare request", create: bare, run: writeRequest },
    { name: "api request", create: api, run: writeRequest },
    { name: "bare error", create: bare, run: writeError },
    { name: "api error", create: api, run: writeError },
    { name: "bare child", create: bare, run: writeChild },
    { name: "api child", create: api, run: writeChild },
    { name: "bare worker event", create: bare, run: writeWorkerEvent },
    { name: "worker event", create: worker, run: writeWorkerEvent },
    { name: "bare performance marker", create: bare, run: writePerformance },
    { name: "api performance marker", create: api, run: writePerformance },
];

function allocatedBytes(profile: HeapProfiler.SamplingHeapProfile): number {
    const pending = [profile.head];
    let total = 0;
    while (pending.length > 0) {
        const node = pending.pop();
        if (node === undefined) break;
        total += node.selfSize;
        pending.push(...node.children);
    }
    return total;
}

function percentile({
    values,
    fraction,
}: {
    values: readonly number[];
    fraction: number;
}): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.at(Math.floor((sorted.length - 1) * fraction)) ?? 0;
}

async function measure(scenario: Scenario) {
    const logger = scenario.create();
    for (let index = 0; index < warmupOperations; index++) scenario.run(logger);
    global.gc?.();
    const heapBefore = process.memoryUsage().heapUsed;
    let peakHeap = heapBefore;
    const latencies: number[] = [];
    let elapsedMs = 0;
    for (let batch = 0; batch < timingBatches; batch++) {
        const started = performance.now();
        for (let index = 0; index < operationsPerBatch; index++)
            scenario.run(logger);
        const elapsed = performance.now() - started;
        elapsedMs += elapsed;
        latencies.push((elapsed * 1000) / operationsPerBatch);
        peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
    }
    global.gc?.();
    const retainedHeapDelta = process.memoryUsage().heapUsed - heapBefore;

    // Sample allocations separately so inspector overhead does not skew timing.
    const session = new Session();
    session.connect();
    let sampledBytes = 0;
    try {
        await session.post("HeapProfiler.startSampling", {
            samplingInterval: 16_384,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true,
        });
        for (let index = 0; index < allocationOperations; index++)
            scenario.run(logger);
        const sampled = await session.post("HeapProfiler.stopSampling");
        sampledBytes = allocatedBytes(sampled.profile);
    } finally {
        session.disconnect();
    }
    return {
        scenario: scenario.name,
        logsPerSecond: Math.round(
            (timingBatches * operationsPerBatch * 1000) / elapsedMs,
        ),
        batchMeanUsP50: Number(
            percentile({ values: latencies, fraction: 0.5 }).toFixed(2),
        ),
        batchMeanUsP95: Number(
            percentile({ values: latencies, fraction: 0.95 }).toFixed(2),
        ),
        sampledAllocatedBytesPerLog: Math.round(
            sampledBytes / allocationOperations,
        ),
        peakHeapGrowthKiB: Math.round((peakHeap - heapBefore) / 1024),
        retainedHeapDeltaKiB: Math.round(retainedHeapDelta / 1024),
    };
}

if (global.gc === undefined)
    throw new Error("Run the benchmark with node --expose-gc");
const results = [];
try {
    for (const scenario of scenarios) results.push(await measure(scenario));
} finally {
    await routes.close();
}
console.log(
    JSON.stringify(
        {
            node: process.version,
            platform: platform(),
            architecture: arch(),
            cpu: cpus().at(0)?.model,
            warmupOperations,
            timedOperations: timingBatches * operationsPerBatch,
            allocationOperations,
            outputCharacters,
            results,
        },
        null,
        2,
    ),
);
