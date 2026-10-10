# Privacy-minimized TypeScript backend logging

The canonical implementation is `src/logPrivacy.ts`. It is synced into the API
and Conversation Email Updates worker with `make sync-ts-backend`. Edit the
canonical source, not generated service copies.

## Rule for new logs

Use the configured privacy-aware logger and schema-derived events (`logApiError`
in the API; structured events in the email-update worker). Supply only approved
structured metadata and reviewed static messages. Add new fields/messages to the
explicit policy rather than embedding runtime text or creating an unrestricted
logger. Preserve the privacy hooks on child loggers and test the emitted output.

## Processing model

1. **Project metadata:** `projectLogFields` reads only explicitly declared data
   properties and parses each field through its Zod schema. Unknown fields,
   invalid values, accessors, and arbitrary nested content are omitted. A malformed
   field does not discard valid neighboring fields.
2. **Project errors:** `toLogError` retains approved error types/codes, status codes,
   bounded first-party source locations, and at most four causes. Raw exception
   messages, request/response configuration, SQL, values, absolute paths, and
   third-party stack frames are omitted. It recognizes Node's native stack accessor
   without calling arbitrary custom getters.
3. **Project messages:** the API admits reviewed messages/templates from
   `services/api/src/logging/messages.ts`. Template substitutions become `[value]`;
   interpolation arguments never reach Pino. Unknown messages become
   `Application event`. Register useful new messages explicitly or use a typed
   event; never add runtime/provider/user text to the template list.
4. **Final output projection:** `sanitizeLogOutput` uses Pino's supported
   `hooks.streamWrite` boundary to project the complete JSON record before any
   destination or transport receives it. This is necessary because Pino resets
   binding formatters on child loggers. Unknown child bindings, `setBindings`
   additions, and message prefixes must not bypass the output policy.
5. **Native redaction:** Pino's `redact` configuration removes known secret fields
   as an additional backstop. It is not a substitute for the schema projections.

Sanitization catches malformed input and emits a fixed failure event without
including the original data. Stack input, cause chains, message length, and final
record size are bounded. The emitted envelope retains level and timestamp.
Objects supplied by callers are not mutated.

## API integration

`services/api/src/logging/privacy.ts` creates the API policy and registers actual
Fastify route templates through `onRoute`. Request logs contain the HTTP method
and registered route template, not raw URLs, queries, host headers, IPs, user
agents, cookies, or bodies. Unmatched/unresolved routes use `[unmatched]`; the
implementation never falls back to a raw URL. Response logs retain status codes.

The metadata allowlist includes counts/timings and selected pseudonymous user
UUIDs, conversation identifiers, and generated request IDs for correlation.
**These logs are privacy-minimized, not anonymous.** The presence of an allowed
field is not proof that its collection is needed for every event; select the
minimum context required at the call site.

For new error events, use `logApiError` and its schema-derived discriminated union:

```typescript
logApiError({
    logger: log,
    level: "warn",
    event: {
        event: "email_deliverability_check_failed",
        provider: "reacher",
    },
    error,
});
```

The raw error is projected by the configured logger. Existing Pino overloads such
as `log.error(error)` and `log.error({ err: error }, message)` are also handled;
the error's message must not leak into the top-level `msg` field.

Ranking `AGORA_LOAD_EVENT` records have a dedicated schema. Approved event names,
outcomes, correlation IDs, and numeric performance metadata are retained; extra
metadata is removed. Malformed markers are replaced with a generic event rather
than being forwarded as raw JSON.

Drizzle debug logs emit a database-query event and parameter count. Neither the
SQL statement nor parameter values are logged, including statements containing
inline literals. Existing SQL logging flags still gate the diagnostic event.

## Conversation Email Updates worker

The worker retains its existing schema-derived structured-event model and error
categories. It reuses the shared field/output projection for persistent context
and final output. Its service/environment/worker identity and approved delivery
event fields remain available. The development exercise uses this same logger.

Never place recipient information, tokens, bodies, or raw provider responses in
logger bindings. Do not override the privacy hooks/serializers in a child logger
or introduce a separate unrestricted logger.

## Boundaries

This component applies to configured TypeScript backend Pino loggers. Python
logging, direct console/stdout output, frontend/Sentry events, reverse-proxy logs,
and provider logs have separate emission paths and policies. Sanitizing at the
Pino boundary does not modify those paths or retroactively erase existing logs.

The frontend already has dedicated Sentry event/replay projections. Infrastructure
and Python logging must be reviewed through their own integrations before making
an all-services privacy guarantee. No prototype/global monkey patches or logging
message code-generation step are used by this component.

## Verification

Regression tests inspect actual emitted JSON using synthetic private values in
Axios and Drizzle errors, nested causes, unknown metadata, formatted/interpolated
messages, logger bindings, and token-bearing URLs. They also check useful route,
status, count, and performance fields, non-mutating behavior, malformed inputs,
and bounded stack/cause handling.

```bash
# From services/shared-backend
pnpm test src/logPrivacy.test.ts src/logger.test.ts

# From services/api
pnpm typecheck
pnpm exec vitest run src/logging/privacy.test.ts src/shared-backend/logPrivacy.test.ts

# From services/conversation-email-update-worker
pnpm typecheck
pnpm exec vitest run src/logger.test.ts src/observability.test.ts
```

References: [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
[Fastify logging](https://fastify.dev/docs/latest/Reference/Logging/), and
[Pino logger options](https://github.com/pinojs/pino/blob/main/docs/api.md).
