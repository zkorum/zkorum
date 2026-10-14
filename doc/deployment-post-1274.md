# Deployment after PR #1274

Prepared October 13, 2026. Confirmed deployment landmark: PR #1274, commit
`461465718ee43cff90a04ac14e56cb87e42e470d`, is already deployed. Release target:
`d05f5ef0c732a9d1a5812ed855e13eba4a8e7758` (upstream main at preparation time).

This runbook assumes the existing production Docker Compose topology and a
maintenance-window cutover. It initially keeps phone registration closed and AI
suggestions disabled. Check each service's deployed image and the writer's Flyway
history: a confirmed frontend deployment alone does not prove that every backend
and worker was deployed to the same commit.

## 1. Pending changes

- [#1270](https://github.com/zkorum/agora/pull/1270): SMS reservations/budgets,
  Turnstile, phone/account restrictions; Polis one-at-a-time voting, bounded
  statement pages, repeated Undo, guest/vote cache fixes; strict contracts and
  atomic notifications. Deploy API, Agora, import and math workers with
  V0093–V0096.2 and coordinated contracts/notification writers.
- [#1275](https://github.com/zkorum/agora/pull/1275): browser language preferences
  and reset/account race fixes. Deploy Agora.
- [#1276](https://github.com/zkorum/agora/pull/1276): export replica-lag, retry,
  completion and cleanup fixes. Deploy API and Agora.
- [#1277](https://github.com/zkorum/agora/pull/1277): AI-charter resources,
  comparison FAQ, localization and RTL. Deploy the Svelte landing page independently.
- [#1278](https://github.com/zkorum/agora/pull/1278): indexing protection, privacy
  logging, faster translation refresh; conversation/project reassignment,
  append-only seed management, version-aware statement editing/voting; survey
  choice text/exports; 150-character titles and 350-character statements; ranking
  soft deletion; country policies and revised monthly SMS budget. Deploy API,
  Agora and affected workers with V0097–V0105, including fractional versions.
- [#1272](https://github.com/zkorum/agora/pull/1272): AI seed suggestions,
  action-scoped Turnstile, cross-instance Valkey quotas and single-use acceptance
  analytics. Deploy API, Agora and email worker shared logging; no migration;
  disabled by default.
- [#1279](https://github.com/zkorum/agora/pull/1279): agent documentation;
  no runtime deployment.

#1272's description predates final hardening. Use the merged code and current API
README: production AI generation requires Turnstile and available Valkey, and the
Turnstile environment names have changed.

### Service/image mapping

- `services/api`: Compose `api`, image `quay.io/zkorum/agora-api`.
- `services/agora` (Vue/Quasar): Compose **`app`**, image
  `quay.io/zkorum/agora-app-production`.
- `services/import-worker`: Compose `import-worker`, image
  `quay.io/zkorum/agora-import-worker`.
- `services/math-updater`: Compose `math-updater`, image
  `quay.io/zkorum/agora-math-updater`.
- `services/scoring-worker`: Compose `scoring-worker`, image
  `quay.io/zkorum/agora-scoring-worker`.
- `services/conversation-email-update-worker`: Compose
  `conversation-email-update-worker`, image
  `quay.io/zkorum/agora-conversation-email-update-worker`.
- `services/content-translation-worker`: Compose `content-translation-worker`,
  image `quay.io/zkorum/agora-content-translation-worker`.
- `services/ai-description-retry-worker`: Compose `ai-description-retry-worker`,
  image `quay.io/zkorum/agora-ai-description-retry-worker`.
- `services/description-translation-retry-worker`: Compose
  `description-translation-retry-worker`, image
  `quay.io/zkorum/agora-description-translation-retry-worker`.
- `services/app` (Svelte landing page): separate deployment on the existing Netlify
  project.

Refresh both description retry images because they install the changed shared
analysis package. #1271's math persistence fix is already before the cutoff;
include the current math image for this release's schema artifacts. Increase
`MATH_UPDATER_ANALYSIS_ENGINE_EPOCH` only if an unchanged generation remains marked
non-retryable and needs recovery, rather than as a routine migration step.

## 2. Configuration to prepare before building

### API runtime configuration

Preserve production database writer/replica settings, existing `PEPPERS` and their
version order, Twilio credentials, Google/AWS credentials, Valkey, and existing
Email Updates delivery gates. The checked-in Compose file is an example with old
tags/placeholders; update the actual production file.

Suggested initial API settings:

```dotenv
NODE_ENV=production
PHONE_AUTH_MODE=disabled
THROTTLE_SMS_SECONDS_INTERVAL=30
PHONE_SMS_COST_CENTS_BY_COUNTRY={}
TURNSTILE_ENABLED=false
TURNSTILE_SECRET_KEY=<production widget secret>
TURNSTILE_ALLOWED_HOSTNAMES=agoracitizen.app,www.agoracitizen.app
PHONE_SMS_BUDGET_ALERT_EMAIL=<operator mailbox>
AI_SUGGESTIONS_ENABLED=false
AI_SUGGESTIONS_SOURCE=bedrock
CONVERSATION_EMAIL_UPDATE_SNS_SIMULATOR_ENABLED=false
```

These are values to add to the service's runtime environment/secret injection,
not literal shell commands. Supply the actual widget hostnames served in production.

- **Replace and remove** `PHONE_TURNSTILE_ENABLED`,
  `PHONE_TURNSTILE_SECRET_KEY`, and `PHONE_TURNSTILE_ALLOWED_HOSTNAMES` with
  `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_ALLOWED_HOSTNAMES`.
  Even obsolete names with empty/false values fail API validation.
- `scripts/infra/docker-compose-production.yml` still contains obsolete names.
  Correct the environment keys and any `${...}` secret references in the actual
  Compose file before starting the new API.
- Set `PHONE_AUTH_ALLOWED_COUNTRIES` and
  `PHONE_REGISTRATION_ALLOWED_COUNTRIES` to the reviewed lists in
  `services/api/env.example`, or retain the canonical defaults by omitting them.
  Registration countries must be a subset of authentication countries. An empty
  registration list closes all new phone enrollment, including attaching a phone
  to an existing account. Every authentication destination needs a built-in SMS
  estimate or a positive integer-cent override such as `{"FR":30}`.
- The resend cooldown now requires **at least 30 seconds**. Replace any old value
  below 30. Existing response padding settings can remain; defaults are 2000 ms
  plus up to 500 ms jitter in both active modes.
- Keep the existing `QUEUE_VALKEY_URL` connected to the production Valkey service.
  The checked-in Compose example omits it; carry it forward from the actual runtime.
- Alerts use the API's existing `EMAIL_FROM_ADDRESS`, `AWS_SES_REGION`, AWS
  credentials/IAM role and email transport. Confirm SES sender permission and
  recipient delivery. `PHONE_SMS_BUDGET_ALERT_EMAIL` is optional; omit it entirely
  if alert delivery is not configured. Budget enforcement still works.
- Confirm `SERVER_URL_PROD` matches the canonical public origin and existing
  `SERVER_DID_PROD`/frontend API audience settings. Preserve the existing identity.
- Keep production test auth overrides absent and `TEST_CODE=0`.

### Agora build-time configuration

In `services/agora/.env.production`, preserve the existing production API URL,
audience, Sentry and feature settings, and add:

```dotenv
VITE_STAGING=false
VITE_PHONE_AUTH_MODE=enabled
VITE_TURNSTILE_SITE_KEY=<production public widget key>
VITE_AI_SUGGESTIONS_ENABLED=false
```

`VITE_PHONE_AUTH_MODE=enabled` lets the backend's runtime policy control the UI;
the API will initially keep registration closed with `login_only`. If you instead
build with `login_only`, reopening registration later also requires a frontend rebuild.

Remove `VITE_PHONE_TURNSTILE_SITE_KEY`; it is rejected. These frontend values are
compiled into the image: changing server Compose environment alone will not change them.

Create a real managed Cloudflare Turnstile widget for production, register the
frontend hostnames, and use a separate widget for staging. Allow
`https://challenges.cloudflare.com` in script/frame CSP sources if a global CSP is
configured. Production rejects test keys. Phone requests use action `phone_sms`;
AI generation uses `ai_seed_suggestions`, selected by the application. A native
custom-scheme WebView needs a tested supported challenge flow before enforcement.

The production image build also requires the existing ignored
`services/agora/.env.sentry-build-plugin` BuildKit secret file.

## 3. Build and publish the images

Use a clean build checkout at the pinned release commit with its committed synced
sources/generated artifacts and production build configuration. Use a unique tag
for all nine images. These examples target the repository's production `linux/amd64`
platform and push directly, including Python images whose Makefile buildx targets
do not explicitly load images into the local Docker image store.

Run this block as a Bash script from the repository root, after Docker/registry
login and buildx setup. Stop on a failed build:

```bash
set -e
export TAG=post1274-d05f5ef0

docker buildx build --platform linux/amd64 --push \
  -f services/api/Dockerfile \
  -t "quay.io/zkorum/agora-api:$TAG" services/api

docker buildx build --platform linux/amd64 --push \
  --secret id=sentry_auth_token,src=services/agora/.env.sentry-build-plugin \
  -f services/agora/Dockerfile.production \
  -t "quay.io/zkorum/agora-app-production:$TAG" services/agora

docker buildx build --platform linux/amd64 --push \
  -f services/conversation-email-update-worker/Dockerfile \
  -t "quay.io/zkorum/agora-conversation-email-update-worker:$TAG" \
  services/conversation-email-update-worker

for service in import-worker math-updater content-translation-worker \
  ai-description-retry-worker description-translation-retry-worker; do
  docker buildx build --platform linux/amd64 --push \
    -f "services/$service/Dockerfile" \
    -t "quay.io/zkorum/agora-$service:$TAG" .
done

docker buildx build --platform linux/amd64 --push \
  --build-arg PIP_INSTALL_TARGET=. \
  -f services/scoring-worker/Dockerfile \
  -t "quay.io/zkorum/agora-scoring-worker:$TAG" services/scoring-worker
```

All builds must succeed before cutover. Retain the existing GPU variant if the
production scoring deployment uses one. Validate the built release in staging,
including phone/Turnstile on real staging hostnames and the application checks in
section 8, before the production maintenance window.

## 4. Prepare production and drain old writers

1. Record current image tags/digests and save the current production configuration.
   Ensure a usable database backup/RDS restore point exists.
2. Edit every affected service's `image:` to its newly published tag. Use the
   existing production Compose project and file location so the asset volume stays
   attached to the same project.
3. Correct the environment configuration from section 2, initially with phone auth
   disabled, Turnstile enforcement off and AI suggestions off.
4. Validate and pull before stopping traffic. From the server directory containing
   the actual production Compose file:

```bash
docker compose -f docker-compose-production.yml config --quiet
docker compose -f docker-compose-production.yml pull \
  api app import-worker math-updater scoring-worker \
  conversation-email-update-worker content-translation-worker \
  ai-description-retry-worker description-translation-retry-worker
```

5. Begin the maintenance window and drain incoming API writes using the existing
   ingress maintenance mechanism. Stop old application processes gracefully, letting
   buffered votes/imports and in-flight worker work finish or release their leases:

```bash
docker compose -f docker-compose-production.yml stop -t 600 \
  app api import-worker math-updater scoring-worker \
  conversation-email-update-worker content-translation-worker \
  ai-description-retry-worker description-translation-retry-worker
```

Confirm the processes have stopped before migrating. Coordinate any API replicas
or writers running outside this Compose project too. Keep PostgreSQL, Valkey and
the existing ingress infrastructure available. Preserve the `agora-assets` volume
and old chunks; do not use `docker compose down -v`.

## 5. Apply the database migrations to the writer

Use the pinned release checkout's `services/api/database/flyway` directory. Inspect
the writer's existing history: a fully aligned pre-#1270 deployment is expected to
have V0092.1, with V0093 onward pending. Use actual history if service deployments
were independent.

Supply `FLYWAY_URL` (a **JDBC PostgreSQL writer URL**), `FLYWAY_USER`, and
`FLYWAY_PASSWORD` through the operator's secret environment. From `services/api`:

```bash
docker run --rm --network host \
  --env FLYWAY_URL --env FLYWAY_USER --env FLYWAY_PASSWORD \
  -v "$PWD/database/flyway:/flyway/conf" \
  -v "$PWD/database/flyway:/flyway/sql" \
  flyway/flyway info

docker run --rm --network host \
  --env FLYWAY_URL --env FLYWAY_USER --env FLYWAY_PASSWORD \
  -v "$PWD/database/flyway:/flyway/conf" \
  -v "$PWD/database/flyway:/flyway/sql" \
  flyway/flyway validate
```

The repository's `pnpm db:migrate` does not forward shell `FLYWAY_*` variables into
its Docker container. It works when the mounted `flyway.conf` is already configured
for the production writer; the explicit commands here forward the operator values.

Before V0096, check legacy notification details for duplicate `notification_id`s
in all four detail tables and `notification_opinion_vote.num_votes < 1`. Also check
parent/detail completeness, variant matching and export cancellation/failure
reasons against V0096.1. The trigger migration does not retroactively audit all
legacy rows. Resolve discrepancies deliberately before resuming production writes.

Run this read-only preflight on the writer; both counts should be zero:

```sql
SELECT count(*) AS invalid_vote_counts
FROM notification_opinion_vote WHERE num_votes < 1;

WITH detail_rows AS (
    SELECT notification_id, 'vote' AS kind FROM notification_opinion_vote
    UNION ALL
    SELECT notification_id, 'opinion' FROM notification_new_opinion
    UNION ALL
    SELECT notification_id, 'export' FROM notification_export
    UNION ALL
    SELECT notification_id, 'import' FROM notification_import
), detail_counts AS (
    SELECT notification_id, count(*) AS total,
           count(*) FILTER (WHERE kind = 'vote') AS votes,
           count(*) FILTER (WHERE kind = 'opinion') AS opinions,
           count(*) FILTER (WHERE kind = 'export') AS exports,
           count(*) FILTER (WHERE kind = 'import') AS imports
    FROM detail_rows GROUP BY notification_id
)
SELECT count(*) AS inconsistent_notifications
FROM notification n
LEFT JOIN detail_counts d ON d.notification_id = n.id
WHERE (n.notification_type = 'security_add_email' AND COALESCE(d.total, 0) <> 0)
   OR (n.notification_type <> 'security_add_email' AND COALESCE(d.total, 0) <> 1)
   OR (n.notification_type = 'opinion_vote' AND COALESCE(d.votes, 0) <> 1)
   OR (n.notification_type = 'new_opinion' AND COALESCE(d.opinions, 0) <> 1)
   OR (n.notification_type IN ('export_started', 'export_completed', 'export_failed',
                              'export_cancelled') AND COALESCE(d.exports, 0) <> 1)
   OR (n.notification_type IN ('import_started', 'import_completed', 'import_failed')
       AND COALESCE(d.imports, 0) <> 1)
   OR EXISTS (
       SELECT 1 FROM notification_export e WHERE e.notification_id = n.id
       AND ((n.notification_type = 'export_cancelled' AND e.cancellation_reason IS NULL)
         OR (n.notification_type <> 'export_cancelled' AND e.cancellation_reason IS NOT NULL)
         OR (n.notification_type <> 'export_failed' AND e.failure_reason IS NOT NULL))
   );
```

With **all old writers stopped**, apply all pending migrations in one pass:

```bash
docker run --rm --network host \
  --env FLYWAY_URL --env FLYWAY_USER --env FLYWAY_PASSWORD \
  -v "$PWD/database/flyway:/flyway/conf" \
  -v "$PWD/database/flyway:/flyway/sql" \
  flyway/flyway migrate
```

Do not set a version-96 target for this maintenance-window procedure. Such a target
belongs to the alternative staged live rollout in #1270; applying V0096.1 while
old non-transactional notification writers still serve traffic is incompatible.

- **V0093:** phone blocks/account restrictions.
- **V0094:** Polis presentation.
- **V0095:** SMS policy/reservations/alerts.
- **V0096, V0096.1, V0096.2:** notification constraints and efficient integrity triggers.
- **V0097, V0098, V0098.1, V0099:** monthly budget, nullable burst limits,
  expiring pauses, legacy backfill, US$100 new-policy default.
- **V0100, V0100.1:** historical project assignments, backfill and integrity triggers.
- **V0101:** survey choice text and historical Email Updates scope FK.
- **V0102:** wider titles, statement editing attribution, realtime index.
- **V0103:** ranking soft-delete columns/indexes.
- **V0105:** exclude annotation-only survey changes from scoring invalidation.

There are **16 new SQL migration files**, including fractional versions. V0104 is
not present in this release; do not create a filler migration. Run `info` and
`validate` again and confirm the existing replica has replayed the schema changes
before starting readers. If Flyway reports a failure/checksum mismatch, investigate
the actual history rather than automatically repairing it or altering applied SQL.

Earlier project-document and score-display migrations/backfills belong to the
pre-cutoff release; run them here only if the actual deployed history shows they
were missed.

## 6. Bring up the updated API, frontend and workers

Keep ingress in maintenance and phone auth disabled. From the production Compose
directory, first start only the updated API:

```bash
docker compose -f docker-compose-production.yml up -d --no-deps api
docker compose -f docker-compose-production.yml ps api
docker compose -f docker-compose-production.yml logs --since 10m api
```

Confirm startup succeeds and the indexing endpoint is available. The new frontend
container must resolve `api:8080` on its Docker network; its nginx performs a POST
lookup for conversation HTML. Verify this network alias if the actual deployment
differs from the checked-in topology.

Then start the updated Vue frontend and workers:

```bash
docker compose -f docker-compose-production.yml up -d --no-deps \
  app import-worker math-updater scoring-worker \
  conversation-email-update-worker content-translation-worker \
  ai-description-retry-worker description-translation-retry-worker

docker exec agora_nginx nginx -t
docker exec agora_nginx nginx -s reload
```

The updated import worker normalizes event timestamps to UTC; it must replace the
old producer before imports resume with the stricter API parser. All notification
writers now need the new transactional implementation.

`update-agora.sh` only runs Compose `up -d` and reloads ingress nginx. It neither
pulls images nor runs migrations; the explicit pull/migration steps above are
necessary even when using the helper for the final startup.

### Incident restrictions, if deploying the incident blocklist

V0093 creates the structures but does not block any phone or account by itself.
Keep phone auth disabled while applying the reviewed private manifest. From the
release checkout's `services/api` with installed operator dependencies:

```bash
pnpm exec tsx scripts/import-blocked-phones.ts /private/path/reviewed.json

NODE_ENV=production pnpm exec tsx --env-file=/private/path/operator.env \
  scripts/import-blocked-phones.ts /private/path/reviewed.json --apply
```

Preview opens no database connection. The apply step uses writer settings from the
operator env, **not** the server container's Compose environment. Ensure that file
sets `NODE_ENV=production` and the real writer connection/AWS settings. The importer
applies approved phone blocks, expires matching challenges, and restricts/revokes
sessions for explicitly selected incident-created accounts atomically. Preserve
the original peppers; account restrictions and phone blocks are separate states.

For candidate extraction, use the existing
`scripts/twilio-incident-manifest.ts <incident-log> <private-output.json>` workflow
and review the candidates before applying. Populated incident artifacts stay private.

### Inspect the SMS policy and finish the phone rollout

On the database writer:

```sql
SELECT id, sending_enabled, monthly_budget_cents, warning_percent,
       estimated_cents_per_send, hourly_send_limit, daily_send_limit,
       hourly_budget_cents, daily_budget_cents,
       registration_paused_at, registration_pause_expires_at
FROM phone_sms_budget_policy WHERE id = 1;
```

A missing row will initialize automatically when an active Twilio phone-auth path
starts, with sending enabled, **10000 cents/month**, a **75% warning**, a **15-cent
floor**, and no hourly/daily limits. With phone auth disabled it can remain absent.
For this rollout, US$100 is the example allowance; set a different operator-approved
allowance before reopening if needed. Existing rows preserve their limits/shutdowns:
V0098.1 only backfills enabled zero-budget legacy rows to US$30, and V0099 changes
the default rather than updating every existing row.

To adopt the US$100 allowance on an existing row:

```sql
UPDATE phone_sms_budget_policy
SET monthly_budget_cents = 10000, warning_percent = 75,
    updated_at = clock_timestamp()
WHERE id = 1;
```

To preconfigure a missing row explicitly at the same defaults:

```sql
INSERT INTO phone_sms_budget_policy
    (id, sending_enabled, estimated_cents_per_send,
     monthly_budget_cents, warning_percent)
VALUES (1, true, 15, 10000, 75)
ON CONFLICT (id) DO NOTHING;
```

Inspect again. Enable `sending_enabled` only if an existing shutdown should be
lifted; updating the ceiling does not enable it or clear pauses. Reservations debit
estimated spending even when provider delivery fails/is uncertain. This policy
limits application estimates, not Twilio's exact invoice or earlier unbudgeted usage.

Configure Twilio Verify SMS Geo Permissions with **Fraud Guard** for the API's
authentication countries, including login-only destinations. Disable other SMS
destinations and unused Voice verification. Review Safe List exceptions.

Once the new frontend widget is installed and the incident/policy steps are done,
change the API to:

```dotenv
PHONE_AUTH_MODE=login_only
TURNSTILE_ENABLED=true
```

Recreate the API to apply the runtime settings:

```bash
docker compose -f docker-compose-production.yml up -d --no-deps api
```

Verify phone flows through the maintenance bypass before resuming public traffic.
Existing accounts can log in while budget allows; enrollment remains closed. A
budget pause still permits verification of already-issued login codes, while the
static `PHONE_AUTH_MODE=disabled` also shuts down phone verification.

## 7. Optional feature activation

### Reopen phone registration

After verifying login, alerts and reservations, set API `PHONE_AUTH_MODE=enabled`
and recreate the API. Country enrollment rules, blocks and budget pauses remain
authoritative. With frontend `VITE_PHONE_AUTH_MODE=enabled`, a rebuild is unnecessary;
an explicitly `login_only` frontend needs rebuilding first.

The monthly allowance uses the UTC calendar month. Automatic warning pauses expire
at the next UTC month boundary; manual pauses remain. After reviewing usage, clear
both pause fields when deliberately lifting a manual pause:

```sql
UPDATE phone_sms_budget_policy
SET registration_paused_at = NULL, registration_pause_expires_at = NULL,
    updated_at = clock_timestamp()
WHERE id = 1;
```

### Enable AI seed suggestions

Prepare production Bedrock access and available API Valkey, then configure:

```dotenv
AI_SUGGESTIONS_ENABLED=true
AI_SUGGESTIONS_SOURCE=bedrock
IS_AI_SUGGESTIONS_ORG_ONLY=true
AI_SUGGESTIONS_ALLOWED_ORGS=<pilot organization slug>
AI_SUGGESTIONS_ALLOWED_USERS=
AI_SUGGESTIONS_BEDROCK_REGION=us-east-1
AI_SUGGESTIONS_BEDROCK_MODEL_ID=mistral.mistral-large-3-675b-instruct
AI_SUGGESTIONS_TIMEOUT_MS=30000
TURNSTILE_ENABLED=true
QUEUE_VALKEY_URL=<existing production Valkey URL>
```

Use the existing workload IAM role with `bedrock:InvokeModel` on the selected model,
for the defaults:
`arn:aws:bedrock:us-east-1::foundation-model/mistral.mistral-large-3-675b-instruct`.
Verify model access on Agora's AWS account; startup credential resolution alone does
not prove model authorization. Confirm the feature's privacy-policy wording and
translated labels before public activation, as noted in #1272.

The empty allowlists mean unrestricted access within the org-only rule; use actual
pilot slugs if restricting the initial release. The quota is 5 generations/minute
per user across API instances; it is not a monetary/daily Bedrock budget. The API
requires working Valkey for enabled production suggestions and uses action
`ai_seed_suggestions` separately from phone tokens.

Deploy/recreate the API, then rebuild/redeploy Agora with
`VITE_AI_SUGGESTIONS_ENABLED=true`. Leave the public Turnstile key configured. The
frontend uses a 90-second request timeout; ensure the outer proxy's timeout supports
the API's configured generation deadline (30 seconds by default, at most 60 seconds).

### Deploy the Svelte landing page

#1277 is independent. `services/app/netlify.toml` and the Svelte adapter configure
Netlify; deploy the pinned commit through the existing production Netlify project.
Check whether its production build already ran automatically on merge. Compose
`app` controls the Vue frontend and does not deploy this site.

## 8. Verify, resume traffic and monitor

From the production Compose directory:

```bash
docker compose -f docker-compose-production.yml ps
docker compose -f docker-compose-production.yml logs --since 15m \
  api import-worker math-updater scoring-worker \
  conversation-email-update-worker content-translation-worker \
  ai-description-retry-worker description-translation-retry-worker
```

Use the existing CloudWatch log streams if the production logging driver does not
support local `docker compose logs` reads.

Read-only public checks (adjust hostname and known conversation slug):

```bash
curl --fail-with-body -sS -X POST \
  https://agoracitizen.app/api/v1/auth/phone/policy \
  -H 'Content-Type: application/json' --data '{}'

curl --fail-with-body -sS -D - -X POST \
  https://agoracitizen.app/api/v1/conversation/indexing \
  -H 'Content-Type: application/json' \
  --data '{"conversationSlugId":"KNOWN_SLUG"}'

curl --fail-with-body -sS -D - -o /dev/null \
  https://agoracitizen.app/conversation/KNOWN_UNLISTED_SLUG
```

- **Phone:** existing-account login, fresh challenge and resend after 30 seconds,
  real Turnstile token, denied enrollment in login-only mode, blocked destination,
  allowed/authentication-only country behavior. Check a reservation is persisted
  before each real send; use staging to test exhausted/disabled budgets and invalid
  tokens. Verify alert delivery in staging with a deliberately small allowance.
- **Indexing:** unlisted HTML has `X-Robots-Tag: noindex, nofollow`; public indexed
  conversations render successfully; project-scoped and embedded routes work.
  Conversation HTML lookup failures can produce nginx errors, so check connectivity
  as well as indexing headers. Browser translation is allowed when dynamic
  translation is disabled.
- **Voting:** Polis list/one-at-a-time settings, repeated Undo, completion/progress,
  guest first participation, new statements preserving the current card, BWS
  vote/Undo/restart and score refresh.
- **Editing:** project reassignment, append-only seed additions, authorized statement
  edits and version conflicts, current permissions, translated caches, 150-character
  titles/350-character statements.
- **Surveys/exports:** choice annotations and drafts, owner-only response exports,
  CSV/ZIP readiness and retries, notification completion/mark-read.
- **Workers:** imports complete with UTC events, analysis persists without retry
  storms, ranking publication works with tombstones, translation updates appear,
  email-worker delivery matches the existing gates.
- **AI (if enabled):** generation, Add/Discard, duplicate/forged acceptance rejection,
  correct Turnstile action and cross-instance quota behavior.
- **Deployment assets:** a browser tab opened before cutover can still fetch its old
  chunks after the update.

Resume ingress traffic after these checks pass, then monitor API/database errors,
worker progress/leases, budget reservations/alerts and actual provider spending.
Historical reservations/alerts are retained; account for table/index growth.

## 9. Operational stops and rollback boundary

To pause new SMS while leaving already-issued eligible login codes verifiable:

```sql
UPDATE phone_sms_budget_policy
SET sending_enabled = false, updated_at = clock_timestamp()
WHERE id = 1;
```

`PHONE_AUTH_MODE=disabled` is a stronger static shutdown, including verification.
Disable AI through `AI_SUGGESTIONS_ENABLED=false` and hide it on the next frontend
build; this requires no schema rollback.

After V0096.1, old non-transactional notification writers are incompatible. Old API
and frontend vote/edit contracts also differ, and old scoring writers do not follow
the new tombstone policy. Treat pre-release image rollback as a coordinated database
compatibility operation; keep ingress drained and prefer a corrected forward image.
Preserve old tags and the database restore point, and account for writes since the
restore point before any database restore. Do not run generic `db:undo`/`db:clean`
as a recovery shortcut.

### References used

- Merged commits for #1270, #1275, #1276, #1277, #1278, #1272 and #1279.
- `services/api/README.md`, `services/api/env.example`, `services/api/src/app.ts`.
- `services/api/database/flyway/V0093*` through `V0105*`.
- `services/agora/README.md`, `services/agora/src/utils/processEnv.ts`, nginx and
  production Dockerfile.
- `scripts/infra/docker-compose-production.yml` and `update-agora.sh`.
- Service Dockerfiles, image scripts/Makefiles and shared SMS policy schema/code.
