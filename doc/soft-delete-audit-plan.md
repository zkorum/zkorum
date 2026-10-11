# Soft-delete audit and remediation plan

Audited: 2026-10-10. Status: scoring soft-delete implementation and source-policy enforcement complete; eventual physical cleanup belongs to the planned deletion worker.

Requirement clarified: normal `UPDATE` operations and non-destructive upserts are allowed. The restriction is physical deletion of application records, not overwriting mutable values. The plan does not require append-only score history.

Subsequent direction: ordinary services soft-delete these records, and the dedicated deletion worker eventually hard-deletes eligible tombstones. `AGENTS_DELETION_SERVICE_PLAN.md` section 6.5.1 now inventories all three tables and specifies dependency checks, score-reactivation fencing, and child-first snapshot purge.

## Conclusion

At audit time, the repository did **not** satisfy the ordinary-service soft-delete-only rule. The production scoring violations below have now been replaced with updates/upserts and tombstones.

The audit found **three production hard-delete statements**, all in `services/scoring-worker/src/scoring_worker/db.py`, covering two behaviors: replacement of per-user scores and pruning of unpublished ranking snapshots. These deleted derived data rather than conversation, statement, account, or vote roots. The findings are preserved below as the implementation's starting inventory.

No application-table hard deletes were found in the current API runtime, canonical shared TypeScript runtime, landing-page runtime, or other Python worker runtimes. The inspected API deletion actions use logical deletion.

Historical migrations also contain destructive operations. Development-exercise fixture cleanup uses hard deletion but is excluded from the production worker build and image.

## Scope and method

- Inspected the current working tree, including untracked application sources, across `services/` and `scripts/`.
- Searched TypeScript/JavaScript, Python, SQL, Vue/Svelte, and shell sources for ORM deletion, SQL `DELETE FROM`, `TRUNCATE`, destructive schema changes, and related deletion/cleanup helpers; included multiline searches.
- Excluded unit/integration-test files and test fixture directories from violations; reviewed development-exercise cleanup separately.
- Checked actual matched operations, canonical schema definitions, scoring publication call sites, and API readers. JavaScript `Map.delete` / `Set.delete`, removal from in-memory collections, Valkey queue acknowledgement, and build/file cleanup are not application-table hard deletion.
- Reviewed S3 object deletion separately because retained database rows do not imply retained file contents.
- This is a source audit, not a query of deployed databases or their migration history. Dependencies, external clones, and local incident/generated-test artifacts are outside the first-party application audit.

## 1. Production violations

All three statements are in `services/scoring-worker/src/scoring_worker/db.py`:

| Location at audit time | Operation | Behavior at audit time |
| --- | --- | --- |
| `_write_scores_batch`, line 787 | `delete(MaxdiffUserEntityScore)` | Deletes all previous per-user score rows for the affected conversations before inserting the new scores. Also clears obsolete scores when a publication has no replacement scores. |
| `_prune_unpublished_ranking_snapshots`, line 947 | `delete(RankingConversationStatsItem)` | Deletes item rows belonging to obsolete, unpublished snapshots. |
| `_prune_unpublished_ranking_snapshots`, line 952 | `delete(RankingConversationStatsSnapshot)` | Deletes those obsolete snapshot roots. |

These remain active production paths, now using soft deletion. `_persist_scoring_conversation` calls `_write_scores_batch` during accepted publication, and `_update_ranking_stats_batch` calls snapshot pruning when publishing a new stats snapshot. Pruning preserves the earliest active baseline, current snapshot, and snapshots with checkpoints.

### Schema constraints that matter

At audit time, the canonical definitions in `services/shared-backend/src/schema.ts` had no `deletedAt` field on these tables. The implementation adds it to all three:

- `maxdiffUserEntityScoreTable`: unconditional uniqueness on `(maxdiffResultId, entitySlugId)`.
- `rankingConversationStatsSnapshotTable`: latest-snapshot index, score provenance, and composite identity referenced by item/checkpoint rows.
- `rankingConversationStatsItemTable`: uniqueness on `(statsSnapshotId, rankingItemId)` and composite foreign keys to snapshot, ranking item, and item content.

The existing score uniqueness supports updating/upserting each score in place. Simply removing the hard delete would still be incorrect: obsolete scores would remain visible, plain replacement inserts would conflict, and snapshot readers currently assume pruned rows disappear. Add deletion markers for records that become inactive and filter them in readers.

## 2. Confirmed logical-deletion paths

Representative inspected paths:

| Domain | Source | Representation |
| --- | --- | --- |
| Accounts and credentials | `services/api/src/service/account.ts`, `deleteUserAccount` | Sets account `isDeleted` / `deletedAt` and credential `isDeleted`; retains account/contribution rows. |
| Conversations | `services/api/src/service/post.ts`, `deletePostBySlugId` | Clears conversation and contained statement `currentContentId`; retains root/content rows. |
| Statements | `services/api/src/service/comment.ts`, `deleteOpinionBySlugId` | Clears statement `currentContentId`. |
| Withdrawn votes | `services/api/src/service/voteBuffer.ts` | Clears the vote's current-content pointer. |
| MaxDiff comparisons | `services/api/src/service/maxdiffHistory.ts`, `syncMaxdiffComparisons` | Sets `deletedAt` on replaced/removed comparisons and inserts replacements. |
| Surveys | `services/api/src/service/survey.ts` | Uses `withdrawnAt`, `deletedAt`, and current-content pointers. |
| Projects / organizations | `services/api/src/service/administrator/project.ts` / `organization.ts`, `archiveProject` / `archiveOrganization` | Sets `deletedAt` and unlists the entity. |
| Project documents | `services/api/src/service/projectDocument.ts`, `deleteProjectDocument` | Sets document/file `deletedAt`. |
| Conversation exports | `services/api/src/service/conversationExport/core.ts`, `deleteConversationExport` / `deleteAllConversationExports` | Sets request `deletedAt`. |

These representations are logical deletion even when there is no column literally named `deletedAt`. This audit establishes how deletion is written; it does not certify every visibility, recovery, or parent/child lifecycle rule.

## 3. Other destructive operations

### Historical migrations

Eight Flyway data migrations contain **18 `DELETE FROM` statements and one persistent-table `TRUNCATE`**:

| Migration under `services/api/database/flyway/` | Effect |
| --- | --- |
| `V0028.1__cleanup_bad_zupass_nullifiers.sql` | Deletes bad `event_ticket` records. |
| `V0045.1__cleanup_duplicate_maxdiff_items.sql` | Deletes closed-conversation legacy MaxDiff items, contents, and external-source mappings. |
| `V0045.2__dedup_maxdiff_items_within_conversations.sql` | Deletes closed-conversation/duplicate/orphan legacy MaxDiff records. |
| `V0045.4__fix_maxdiff_github_sync_dedup.sql` | Deletes orphan legacy MaxDiff contents and items. |
| `V0046.1__cleanup_orphan_maxdiff_items.sql` | Repeats orphan legacy MaxDiff cleanup. |
| `V0048.1__dedup_maxdiff_items_and_reconcile.sql` | Deletes duplicate/orphan legacy MaxDiff records before enforcing uniqueness. |
| `V0052.1__normalize_existing_email_values.sql` | Truncates `otp_email_destination_state`, then repopulates it with consolidated canonical rows. |
| `V0073.1__backfill_project_language_defaults.sql` | Deletes redundant conversation translation-target rows. |

`V0062.2__backfill_legacy_polis_analysis.sql` also truncates ten **temporary work tables**; those are not persisted application records.

There are also historical `DROP TABLE` migrations, including removal of old polls, exports, Polis analysis tables, and legacy MaxDiff tables. A literal repository-wide ban on destructive SQL must account for schema history too, not just runtime ORM calls.

Do not rewrite already-applied migration files: their checksums and ordering are part of deployment history. Determine application status before proposing any migration-history changes. Future data cleanup must use tombstones; destructive changes to populated application tables require an explicit resolution of the soft-delete-only contract. A new forward migration cannot recover records previously deleted by an old migration. If fresh installations must avoid executing any historical destructive SQL, that requires a separately reviewed migration baseline.

### Development-exercise cleanup

- `services/conversation-email-update-worker/src/devExercise/fixtureStore.ts`: 17 ORM deletion statements for exercise-owned email-update artifacts and synthetic participants, votes, credentials, and preferences.
- `services/conversation-email-update-worker/src/devExercise/databaseGuard.ts`: one SQL deletion of an exercise target reservation.
- `tsconfig.build.json` excludes `src/devExercise/**`; the Dockerfile also removes `dist/devExercise`.
- The exercise entry point is guarded for a dedicated loopback development database, with production/staging rejection and database marker/ownership checks.

Treat these as test-fixture cleanup under the stated test exception, with that scope made explicit in any enforcement check.

### Stored files

The API physically deletes S3 objects through `services/api/src/service/s3.ts`, `deleteFromS3`:

- `services/api/src/service/projectDocument.ts`, around line 692: cleanup deletes document objects while retaining database tombstones.
- `services/api/src/service/conversationExport/core.ts`, around line 2132: cleanup deletes unreferenced export artifacts while retaining database records and clearing their storage metadata.

These are not SQL row deletes, but they do remove stored content. The database remediation below does not make files recoverable. If the soft-delete-only requirement also covers object storage, these cleanup paths need an explicit logical-deletion-only lifecycle before implementation is considered complete.

## 4. Implementation plan

### Step 1 — Add tombstones and active-row constraints

In **canonical** `services/shared-backend/src/schema.ts`:

1. Add nullable `deletedAt` timestamps to the three scoring tables, following existing timestamp precision/style. Existing retained rows start active; do not invent deletion dates for rows that no longer exist.
2. Keep the existing per-user-score unique constraint on `(maxdiffResultId, entitySlugId)`. Upsert mutable scores into the existing row, including reactivating a derived score when it becomes eligible again; do not add a new row/version for every recalculation.
3. Keep snapshot/item composite identity and foreign keys intact. The per-snapshot item uniqueness can remain unconditional because replacement computations create new snapshot IDs.
4. Make current-score and latest-snapshot lookup indexes appropriate for active-row reads, using the expected `deletedAt IS NULL` predicates.
5. Run `make sync-ts-backend` and `make sync-python-artifacts`; generate schema changes through the API's `pnpm db:generate` workflow. Never hand-edit synced TypeScript/Python definitions or normal generated schema SQL.

### Step 2 — Replace scoring hard deletes atomically

In `services/scoring-worker/src/scoring_worker/db.py`:

1. `_write_scores_batch` calls `_sync_personal_scores` within the existing locked publication transaction. Stream existing active identity keys, tombstone only omitted keys in bounded batches, and upsert submitted scores. The conflict update changes score/uncertainty fields and clears `deleted_at` only when a value differs or a retained row is reactivated. Existing score IDs are reused, new score keys are inserted, unchanged active rows are not rewritten, and omitted keys stay soft-deleted. Preserve existing deletion timestamps on inactive rows and clearing behavior for empty scores and participants/items no longer eligible.
2. Snapshot pruning uses a SQL subquery to identify active prunable snapshots under the existing baseline/current/checkpoint protection; tombstone their active item rows and snapshot roots together instead of deleting them. No unbounded snapshot-ID list is transferred into application memory or bound as query parameters. Use one deletion timestamp and preserve existing tombstones on retries.
3. Filter baseline selection, previous-snapshot selection, and reconciliation by active snapshot status. Retained tombstones must not affect checkpoint detection, closure transitions, or whether a conversation requires scoring.
4. Preserve existing revision validation, config locking, score provenance, checkpoint insertion, and outbox publication transaction boundaries.

### Step 3 — Update every affected reader

Add active-row filters throughout:

- `services/api/src/service/maxdiff.ts`: per-user score loading, latest snapshot resolution on replica/primary, baseline queries, requested historical snapshot validation, historical item reads, and checkpoint reads.
- `services/api/src/service/conversationDisplayCounts.ts`: latest ranking snapshot used for feed/display metadata.
- `services/api/src/service/contentTranslation.ts`: historical item-source eligibility and the SQL baseline subquery. A retained tombstoned snapshot/item must not grant access to obsolete content.
- `services/scoring-worker/src/scoring_worker/db.py`: baseline, previous snapshot, and reconciliation queries.
- `services/scoring-worker/scripts/backfill_display_scores.py`: active current-snapshot selection and active item lookup; any intentional processing of retained historical score values must be explicit.

Re-search both schema/model identifiers and raw SQL table names after editing. Do not rely only on the imported table-symbol inventory.

### Step 4 — Enforce the rule and reconcile existing plans

1. The CI source-policy check uses strictly checked TypeScript, typed Python IPC, Drizzle return-type detection, whole string-expression analysis, and PostgreSQL lexical tokens. It covers TypeScript/JavaScript and embedded Vue/Svelte scripts, Python, SQL scripts, and new migrations. Collection deletion, explicit Valkey/Redis acknowledgments, and provable temporary-table operations are allowed. Dynamic SQL with an unresolved executable expression is rejected rather than silently ignored. The check is static enforcement, not a proof of arbitrary runtime-generated SQL behavior.
2. Allow actual tests and the documented, production-excluded development-exercise cleanup. Keep historical migration findings explicit rather than silently treating them as compliant or editing their checksums.
3. Include destructive changes to populated application tables in migration review; a `DROP TABLE` must not bypass the rule by avoiding the word `DELETE`.
4. The user's subsequent direction confirms the dedicated deletion worker as the eventual hard-purge owner. `AGENTS_DELETION_SERVICE_PLAN.md` section 6.5.1 explicitly adds these three scoring tables to that worker's inventory. The policy check permits that dedicated service while rejecting hard deletion in ordinary scoring/API services; exact hashes pin the existing destructive migration exception.
5. Resolve whether stored-file deletion is covered, using the confirmed S3 call sites above.

### Step 5 — Verify and deploy

Extend the existing meaningful integration coverage:

- `services/scoring-worker/tests/test_publication.py`: repeated scoring updates the same per-user score rows/IDs and exposes the latest values; participants/items removed from scoring remain physically present as tombstones, and empty results have no active stale scores. Re-eligible score keys reactivate the same row through the upsert.
- Prove obsolete unpublished snapshot roots/items remain physically present but inactive. Baseline, current, and checkpoint snapshots remain active and preserve their metrics/provenance.
- Verify retries and concurrent/invalidated publications do not create duplicate active scores, reset prior deletion timestamps, or expose mixed score/stats generations.
- `services/api/src/service/maxdiffHistory.test.ts` and relevant content-translation/display-count tests: retained tombstones do not leak into personal scores, snapshot selection, checkpoint lists, historical item responses, or translation authorization.
- Prove the source-policy check rejects a real ORM/SQL hard delete and accepts test cleanup and in-memory deletion.

Run the scoring worker's `make test`, `make lint`, and `make typecheck`, plus the API's `pnpm lint` and relevant API integration tests. Review generated schema artifacts and the forward migration.

Rollout: if the scoring worker is running, pause its publication while migrating and switching both worker writes and API readers. An already stopped worker needs no process action. Start the updated worker once the migration and updated API readers are in place. An old reader would expose retained per-user scores, and an old worker would keep physically deleting them. Required services: **api, scoring-worker**; apply the forward database migration through the normal reviewed migration workflow.

## Acceptance criteria

- No production application-table hard-delete call remains in the currently identified scoring paths.
- Mutable scores are updated/upserted in place; removed per-user scores and pruned snapshots/items are retained with deletion markers.
- Only active rows influence normal reads and work reconciliation.
- Baselines, current results, and published checkpoint numbers retain their existing behavior.
- Test cleanup is explicitly scoped, and newly introduced production hard deletes fail the policy check.
- Historical destructive migrations are pinned explicitly, and the proposed deletion worker owns eligible eventual hard purges; neither is presented as soft deletion.

## Follow-up review: correctness, types, cleanliness, security, performance

- **Correctness:** timestamps are tested against an explicitly old value, avoiding a false pass when repeated writes fall in the same second. A real PostgreSQL constraint failure after child tombstoning verifies rollback of existing scores, snapshot roots/items, and the current score pointer.
- **Type safety:** policy implementation and tests now use strictly checked TypeScript; Python input/output has named typed records, boundary parsing, and independent strict type checking. Parallel source/result arrays and unsafe untyped propagation were removed.
- **Clean code:** personal-score synchronization is isolated from global-score persistence; SQL lexical handling is separated from source traversal. The optional unused personal-score input state was removed.
- **Security:** the guard handles whole string expressions, nested comments, quoted identifiers, case-sensitive temporary names, ordered temporary-table lifetimes, and executable SQL bodies. Development cleanup is exempted only at its known path. Historical files must match their pinned hashes even if an edit removes the destructive statements. Python analysis runs in isolation without importing application code.
- **Performance:** unchanged personal scores are not rewritten, verified with PostgreSQL `xmin`. Removed keys and upsert payloads are bounded batches; snapshot candidates remain in SQL subqueries. Drizzle factory types are cached, and source analysis does not provision the scoring worker's dependency environment.
- **Dead code:** replaced JavaScript policy/test entrypoints, broad directory exemptions, redundant nullable input, duplicate string-fragment analysis, and snapshot-ID materialization were removed. Build/test/CI entrypoints reference the typed implementation.

The policy is a static guard, not a general interpreter or formal proof of arbitrary generated SQL. Its lexical layer deliberately focuses on destructive operations and executable bodies; application data access should continue to use the typed query builders.
