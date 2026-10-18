/** **** WARNING: GENERATED FROM SHARED-BACKEND DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
import { DrizzleQueryError } from "drizzle-orm";
import { createServer } from "node:net";
import { once } from "node:events";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
    createLogPrivacy,
    logContextSchema,
    createLogFieldProjector,
    toLogError,
} from "./logPrivacy.js";

const sourceRoot = new URL("file:///application/src/");
const privateValues = [
    "person@example.invalid",
    "Bearer private-auth-marker",
    "private-otp-marker",
    "postgresql://admin:private-password@private-db/agora",
    "Private survey answer",
    "https://private.invalid/action/private-capability?token=private-token",
];

function captureLogger() {
    const lines: string[] = [];
    const privacy = createLogPrivacy({
        sourceRoot,
        messageTemplates: [
            { parts: ["Application event"] },
            { parts: ["Provider request failed"] },
            { parts: ["Processing conversation ", " completed"] },
            { parts: ["Provider request failed: ", ""] },
        ],
        errorMessageTemplates: [
            { parts: ["Internal invariant failed"] },
            { parts: ["Unable to process account ", ": invalid state"] },
        ],
    });
    const log = pino(
        { level: "debug", ...privacy.options },
        {
            write(line) {
                lines.push(line);
            },
        },
    );
    return {
        log,
        lines,
        records: () =>
            lines.map((line) => {
                const parsed: unknown = JSON.parse(line);
                return z.record(z.string(), z.unknown()).parse(parsed);
            }),
    };
}

describe("log privacy", () => {
    it("projects raw Axios/Drizzle errors without config, SQL, messages or cause values", () => {
        const capture = captureLogger();
        const provider = Object.assign(new Error(privateValues.join(" | ")), {
            name: "AxiosError",
            code: "ERR_BAD_RESPONSE",
            config: {
                method: "post",
                url: privateValues.at(5),
                data: JSON.stringify({
                    to_email: privateValues.at(0),
                    code: privateValues.at(2),
                }),
                headers: { authorization: privateValues.at(1) },
            },
        });
        provider.stack = `${privateValues.join("\n")}\n    at send (file:///application/src/service/email.ts:12:3)\n    at foreign (/private/home/person@example.invalid/provider.js:9:4)`;
        const database = new DrizzleQueryError(
            "select * from answers where email = $1",
            privateValues,
            provider,
        );
        capture.log.warn(provider, "Provider request failed");
        capture.log.error(database);
        capture.log.error(
            { error: database, body: { answers: privateValues } },
            "Provider request failed",
        );
        for (const value of privateValues)
            expect(capture.lines.join("")).not.toContain(value);
        expect(capture.lines.join("")).not.toContain("select * from answers");
        expect(capture.lines.join("")).not.toContain("private/home");
        expect(capture.records().at(0)).toMatchObject({
            msg: "Provider request failed",
            err: {
                type: "AxiosError",
                code: "ERR_BAD_RESPONSE",
                message: "Provider returned an unsuccessful response",
                frames: [{ file: "service/email.ts", line: 12, column: 3 }],
            },
        });
        expect(capture.records().at(1)).toMatchObject({
            msg: "Application event",
        });
    });

    it("omits arbitrary strings, JSON-in-strings, interpolation args and unknown metadata", () => {
        const capture = captureLogger();
        capture.log.info(privateValues.join("\r\n"));
        capture.log.info(
            {
                nested: { content: privateValues },
                config: JSON.stringify(privateValues),
                count: 4,
            },
            "Provider request failed",
        );
        capture.log.info(
            "Provider request failed: %s",
            privateValues.join(" "),
        );
        capture.log.info(
            `Processing conversation ${privateValues.join(" ")} completed`,
        );
        capture.log.info({
            msg: privateValues.at(0),
            event: privateValues.at(4),
            count: privateValues.at(2),
        });
        for (const value of privateValues)
            expect(capture.lines.join("")).not.toContain(value);
        expect(capture.records().at(1)).toMatchObject({
            count: 4,
            msg: "Provider request failed",
        });
        expect(capture.records().at(2)).toMatchObject({
            msg: "Provider request failed: [value]",
        });
        expect(capture.records().at(3)).toMatchObject({
            msg: "Processing conversation [value] completed",
        });
    });

    it("sanitizes base/child/setBindings data before it becomes persistent log context", () => {
        const capture = captureLogger();
        const child = capture.log.child({
            reqId: "req-1",
            count: 2,
            authorization: privateValues.at(1),
            email: privateValues.at(0),
            nested: privateValues,
        });
        child.setBindings({
            token: privateValues.at(2),
            userId: privateValues.at(0),
        });
        child.info("Provider request failed");
        for (const value of privateValues)
            expect(capture.lines.join("")).not.toContain(value);
        expect(capture.records().at(0)).toMatchObject({
            reqId: "req-1",
            count: 2,
        });
    });

    it("does not invoke accessors or toJSON on unknown metadata", () => {
        const capture = captureLogger();
        const getter = vi.fn(() => {
            throw new Error(privateValues.join(" "));
        });
        const toJSON = vi.fn(() => privateValues);
        const value = { count: 7, toJSON };
        Object.defineProperty(value, "userId", {
            get: getter,
            enumerable: true,
        });
        capture.log.info(value, "Provider request failed");
        expect(getter).not.toHaveBeenCalled();
        expect(toJSON).not.toHaveBeenCalled();
        expect(capture.records().at(0)).toMatchObject({ count: 7 });
    });

    it("fails closed on hostile proxies and retains the log event", () => {
        const capture = captureLogger();
        const value = new Proxy(
            {},
            {
                getOwnPropertyDescriptor() {
                    throw new Error(privateValues.join(" "));
                },
            },
        );
        expect(() => {
            capture.log.info(value, "Provider request failed");
        }).not.toThrow();
        expect(capture.lines.join("")).not.toContain("person@example.invalid");
        expect(capture.records().at(0)).toMatchObject({
            event: "log_sanitization_failed",
        });
    });

    it("bounds causes and stacks without mutating the source error", () => {
        const error = new TypeError(privateValues.join(" | "));
        Object.defineProperty(error, "cause", { value: error });
        error.stack = `TypeError: private-otp-marker\n${"    at send (/application/src/service/email.ts:12:3)\n".repeat(200)}`;
        const original = error.stack;
        const safe = toLogError({ error, sourceRoot });
        expect(safe.type).toBe("TypeError");
        expect(safe.causes).toEqual([]);
        expect(safe.frames).toHaveLength(12);
        expect(error.stack).toBe(original);
        expect(JSON.stringify(safe)).not.toContain("private-otp-marker");
    });

    it("retains an actual address-in-use error code and native stack without the bound address", async () => {
        const server = createServer();
        const competing = createServer();
        try {
            server.listen(0, "127.0.0.1");
            await once(server, "listening");
            const address = server.address();
            if (address === null || typeof address === "string")
                throw new Error("Missing test server address");
            const error = await new Promise<Error>((resolve) => {
                competing.once("error", resolve);
                competing.listen(address.port, "127.0.0.1");
            });
            const capture = captureLogger();
            capture.log.error(error, "Provider request failed");
            expect(capture.records().at(0)).toMatchObject({
                err: {
                    code: "EADDRINUSE",
                    message: "Address is already in use",
                },
            });
            const record = z
                .object({
                    err: z.object({
                        frames: z.array(z.object({ file: z.string() })),
                    }),
                })
                .parse(capture.records().at(0));
            expect(
                record.err.frames.some(({ file }) => file === "node:net"),
            ).toBe(true);
            expect(capture.lines.join("")).toContain(
                "Error [EADDRINUSE]: Address is already in use\\n    at node:net:",
            );
            expect(capture.lines.join("")).not.toContain("127.0.0.1");
        } finally {
            competing.close();
            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }
    });

    it("keeps reviewed exception messages and redacts their substitutions through child loggers", () => {
        const capture = captureLogger();
        const error = new Error("Internal invariant failed", {
            cause: new Error(
                "Unable to process account person@example.invalid: invalid state",
            ),
        });
        error.stack =
            "Error: Internal invariant failed\n    at run (file:///application/src/service/work.ts:20:4)\n    at dependency (/application/node_modules/.pnpm/pkg@1/node_modules/pkg/index.js:11:2)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)";
        capture.log.child({ reqId: "req-2" }).error(error);
        expect(capture.records().at(0)).toMatchObject({
            err: {
                message: "Internal invariant failed",
                frames: [
                    { file: "service/work.ts", line: 20, column: 4 },
                    { file: "node_modules/pkg/index.js", line: 11, column: 2 },
                    {
                        file: "node:internal/process/task_queues",
                        line: 105,
                        column: 5,
                    },
                ],
                causes: [
                    expect.objectContaining({
                        message:
                            "Unable to process account [value]: invalid state",
                    }),
                ],
            },
        });
        expect(capture.lines.join("")).not.toContain("person@example.invalid");
        expect(capture.lines.join("")).not.toContain("/application/");
        expect(capture.lines.join("")).toContain(
            "Caused by: Error: Unable to process account [value]: invalid state",
        );
    });

    it("does not accept arbitrary error codes or names as safe identifiers", () => {
        const error = Object.assign(new Error(privateValues.join(" | ")), {
            name: "private-secret-name",
            code: "private-otp-marker",
        });
        expect(toLogError({ error, sourceRoot })).toMatchObject({
            type: "Error",
            code: undefined,
        });
    });

    it("does not evaluate custom error text getters while extracting native stacks", () => {
        const getter = vi.fn(() => "private-otp-marker");
        const error = new Error("private-error-message");
        Object.defineProperty(error, "name", { get: getter });
        const safe = toLogError({ error, sourceRoot });
        expect(getter).not.toHaveBeenCalled();
        expect(safe.frames).toEqual([]);
        expect(JSON.stringify(safe)).not.toContain("private-");
        expect(
            toLogError({
                error: new RangeError("private-error-message"),
                sourceRoot,
            }).type,
        ).toBe("RangeError");
    });

    it("omits malformed fields individually while retaining usable context", () => {
        expect(
            createLogFieldProjector(logContextSchema)({
                count: 3,
                durationMs: Infinity,
                userId: privateValues.at(0),
                token: privateValues.at(2),
            }),
        ).toEqual({ count: 3 });
    });

    it("reuses a compiled projector without retaining previous record values", () => {
        const project = createLogFieldProjector(logContextSchema);
        expect(project({ count: 4, reqId: "req-1" })).toEqual({
            count: 4,
            reqId: "req-1",
        });
        expect(project({ count: 2 })).toEqual({ count: 2 });
        expect(
            project({ count: undefined, email: privateValues.at(0) }),
        ).toEqual({});
    });
});
