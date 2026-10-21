# Low-contention voting and coherent analysis loading

## Behavior

- Persist votes in round-robin, per-conversation transactions of at most 500
  actions. The Valkey fetch size remains independent of transaction size.
- Preserve the conversation lock and shared-payload recheck that protect
  cross-instance cancellation, editing, and retry ordering.
- Update immediate statement counters and a durable realtime event in the vote
  transaction. Do not reconcile conversation-wide counts or construct view
  snapshots there. The existing analysis worker owns the next complete frame.
- Analysis scheduling atomically increments the source generation and creates
  missing work records. It does not update existing worker-owned execution rows.
  Existing primary-database reconciliation detects newer generations even when
  a Valkey wakeup is lost.
- Read the latest activated frame, then pin every section to that exact frame
  identity. A newer publication does not invalidate an in-flight section read.
- Keep displaying a complete cached frame during background refresh and transient
  refresh errors. Promote the replacement only after all its sections match.
  Authorization failures still replace the content with the error state.
- Keep the analysis action-bar counters tied to the displayed frame. Load the
  checkpoint timeline independently. Live statement feedback does not advance
  the analysis frame or its counters.
- Ready group labels, AI-disabled frames, and manifests do not schedule description
  work. Missing English descriptions and translations record idempotent locale
  demand after resolving the frame, including any primary-read fallback. The
  existing workers materialize execution records from demand; reads never repair
  worker-owned records or rewrite request timestamps.
- Reconnect cursors advance monotonically across replay and live delivery.
  Partial statement count updates are ordered per statement by delivery number,
  independently of conversation-wide counts and application clocks.

The existing activated-frame mechanism remains the publication boundary. This
does not introduce a separate frame publisher, another queue, a second debounce
mechanism, or the broader planned unified survey-frame schema.

## Outbox delivery order

Event allocation IDs are not commit order. A business transaction can commit an
older allocated ID after a newer event has already committed. The old dispatcher
prevented cursor gaps by locking the entire outbox against inserts.

The new dispatcher instead assigns delivery IDs to committed pending rows in
transactions of at most 500 events. Only dispatchers lock the singleton dispatch
state; business writers never touch it. Assignments and the upper bound commit
atomically. Late commits remain pending and get later delivery IDs. API instances
consume the same durable delivery order independently for fanout and replay.
One statement-level notification per assignment batch wakes other API instances; the existing periodic
catch-up remains the fallback for lost notifications.

SSE IDs use `delivery:<number>` to distinguish this order from old allocation
cursors. Reconnecting with an old cursor uses the existing latest-state refresh
instead of interpreting an allocation ID as a delivery number.

## Migrations and rollout

1. Apply `V0109__faithful_whiplash.sql`, generated from the canonical schema.
2. Apply `V0109.1__initialize_realtime_delivery_order.sql`. This data backfill
   initializes existing committed history and the delivery counter, then installs
   the delivery-assignment wakeup trigger. Late commits are left for dispatch.
3. Deploy the API and frontend changes together, updating all API instances.
4. Deploy the Python workers with their regenerated models and bounded pools.

Run migrations before starting the new API. The backfill is intentionally a
straightforward one-time update: the measured production outbox held 41,460 rows,
30 MB of table data, and 33 MB including indexes. A disposable PostgreSQL test
executes the real migrations against 41,460 existing events. This is correctness
verification, not a production timing or memory-capacity guarantee.

No migration or infrastructure modification is performed automatically by these
code changes. Keep the existing PostgreSQL driver recovery patch.

## Resource limits

TypeScript database clients now expose:

| Setting                          | Default                                     |
| -------------------------------- | ------------------------------------------- |
| `DB_POOL_MAX`                    | 5 connections per process and database role |
| `DB_STATEMENT_TIMEOUT_MS`        | 30,000                                      |
| `DB_LOCK_TIMEOUT_MS`             | 5,000                                       |
| `DB_IDLE_TRANSACTION_TIMEOUT_MS` | 60,000                                      |

Connection establishment remains bounded to 10 seconds, with TCP keepalive
enabled after 15 seconds. These are separate mechanisms: a statement timeout
cannot detect every broken network connection. The existing native driver patch
and connection-reset regression remain relevant.

Python pools disable overflow. Shared analysis, import, and scoring pools allow
three connections per engine; content translation allows two. Budget the total
across replicas, workers, heartbeat activity, realtime listeners, and monitoring.

Checkpoint selection uses the latest-active-spec index to select the most recent
eligible frame per conversation/specification before expanding its candidates.
It avoids sorting and materializing the complete historical candidate graph.

## Verification and remaining measurement

Regression coverage includes late outbox commits, non-blocking business writes,
bounded dispatch, the real history migration and wakeup trigger, source-generation
updates while a worker row is locked, vote persistence without snapshot creation,
read-only ready-label requests, pinned old-frame reads, and idempotent translation
demand. Existing vote/cancel/edit and connection-reset cases remain required.

Use the existing voting load scenario and a browser observer on a disposable
environment to measure lock hold/wait times, pool waits, query memory, frame lag,
and first-load latency under mixed voting and analysis reads. A read-only source
review or a passing unit test does not establish a production capacity limit.

The confirmed RDS low-memory failover still warrants additional database memory
headroom. These changes reduce unnecessary work and failure amplification; they
do not establish that a 1 GiB instance can sustain the required workload.

## Focused review

- **Correctness:** share cursor parsing between the API and frontend; keep the
  reconnect position monotonic; filter partial count updates per statement rather
  than with a conversation-wide wall-clock watermark. Resolve label-read fallback
  before recording missing locale demand. Derive action-bar overrides in one
  watcher from the displayed frame, including pause/resume transitions.
- **Type safety:** strict decimal cursor parsing rejects malformed and unsafe
  numbers. Vote batch size is an internal constant, removing invalid caller-supplied
  sizes. Database timeout settings are bounded to PostgreSQL's integer range.
  New code uses typed DTOs and narrowing without assertions or lint suppressions.
- **Clean code:** share the cursor protocol and database resource options; use the
  existing worker demand/materialization boundary for both English and translated
  labels rather than retaining a parallel request-time work scheduler.
- **Security:** pinned reads still require an activated frame, matching conversation
  and candidate/result identity, and a visible assessment. Regression tests reject
  unpublished and cross-conversation keys. Cached-content retention excludes
  authorization failures and other nontransient client errors. Event payloads
  remain parsed at the browser and API boundaries.
- **Performance:** delivery assignments produce one notification per SQL statement;
  latest-frame selection precedes candidate expansion and uses existing indexes.
  Ready and AI-disabled label reads are read-only, and missing-label reads never
  update execution rows held by workers.
- **Dead code:** remove the obsolete locale/work repair helpers, the old numeric
  cursor tracker, the upper-bound forwarding wrapper, duplicate stats emissions,
  redundant English label reads, and historical-frame selection maps made
  unnecessary by database-side frame selection.
