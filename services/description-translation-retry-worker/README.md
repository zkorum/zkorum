# Description Translation Retry Worker

Dedicated Python service for description-translation retry/backlog work. The main `math-updater` service owns red-dwarf analysis and immediate first-pass translation when translation is enabled.

Bedrock translation is enabled by default through `DESCRIPTION_TRANSLATION_RETRY_WORKER_AWS_DESCRIPTION_TRANSLATION_ENABLE=true`. Bedrock uses normal AWS credentials plus `DESCRIPTION_TRANSLATION_RETRY_WORKER_AWS_DESCRIPTION_TRANSLATION_*` region, model, timeout, and prompt settings; there is no explicit Bedrock URL. Configure `DESCRIPTION_TRANSLATION_RETRY_WORKER_GOOGLE_APPLICATION_CREDENTIALS` or `DESCRIPTION_TRANSLATION_RETRY_WORKER_GOOGLE_CLOUD_SERVICE_ACCOUNT_AWS_SECRET_KEY` to enable Google fallback/direct translation.

```bash
make dev
```

## Translation validation and retries

Bedrock receives up to two immediate attempts, retrying only missing translations.
When configured, Google fills remaining gaps before durable retry work is released.
A provider timeout skips its second immediate attempt. Token-limited Bedrock batches
are split into smaller requests, preserving successful items if another split fails.
A timeout also stops unstarted split siblings. Outcomes carry a failure category per
description and locale, so a partial provider failure retains the provider cooldown;
it is not reclassified as malformed output. Google fallback merges only missing
locales, preserving an existing Chinese-script translation without duplicate rows.

Both providers reject empty labels/summaries and values exceeding the database's
100/1000-character limits. Confident summary-language mismatches are rejected;
uncertain detections and Kyrgyz (unsupported by the local detector) are accepted.
Short labels are not language-detected. Translation reasoning is optional.

Output/format failures use error code `ai_description_output` and become eligible
after `min(30 seconds, RETRY_COOLDOWN_SECONDS)`. Provider/service failures retain
the configured cooldown (default 300 seconds). The same distinction applies to
English description work. Discovery and claims enforce these delays consistently.

Bedrock response logs include stop reason and token counts. Rejection logs contain
categories, IDs, and lengths, never source or translated text. Each successful
translation batch commits its content-update outbox events in the same transaction,
so unrelated slow batches cannot hold up notifications.
Bedrock clients are initialized lazily and reused across batches. Chinese script
conversion rechecks storage limits without repeating language detection.

## Database polling and recovery

Empty or unclaimed polls back off from the configured idle interval to 5 seconds.
Database failures back off through 5, 10, 20, 40, and at most 60 seconds, resetting
after recovery. All waits are interruptible on shutdown.

`DESCRIPTION_TRANSLATION_RETRY_WORKER_DB_MATERIALIZATION_INTERVAL_SECONDS`
controls primary-side demand reconciliation (default: 5 seconds). When this
creates work, discovery reads the writer once to avoid replica lag; otherwise
discovery uses the configured read connection. The worker preserves discovery's
latest-before-checkpoint priority order.

`DESCRIPTION_TRANSLATION_RETRY_WORKER_DB_STATEMENT_TIMEOUT_SECONDS` and
`DESCRIPTION_TRANSLATION_RETRY_WORKER_DB_IDLE_TRANSACTION_TIMEOUT_SECONDS`
default to 30 and 60 seconds respectively. Explicit PostgreSQL DSN options take
precedence. Phase/timing status and sanitized database errors identify stalled
operations without logging SQL or parameters.

Run checks with `uv run --extra dev pytest`, `uv run --extra dev ruff check src tests`,
and `uv run --extra dev basedpyright src tests`.

Build and push:

```bash
make image-buildx TAG=1.0.0
make image-push TAG=1.0.0
```

For a fresh rebuild, use `make image-buildx TAG=1.0.0 NO_CACHE=1`. See the
[worker image deployment guide](../../README.md#building-worker-images) for when
to bypass Docker's build cache, including package and certificate security updates.
