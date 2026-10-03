# Back API (@zkorum/agora-api)

## Installation

We need `jq` for the custom renaming `scripts/`.

```bash
sudo apt install jq
pnpm install
```

## Starting or creating the database

We use drizzle as ORM, drizzle-kit to generate migration files from drizzle schema, and flyway for actually migrating the PostgreSQL database. You can also use `pnpm drizzle-kit --help` for more commands.

Start by using `env.example` and `database/flyway/flyway.conf.example` to configure conf files `.env` and `flyway.conf`.

Note that the `CONNECTION_STRING` and `flyway.password` variables should be determined by the values you have in the docker-compose.yml file.

Run a local PostgreSQL instance:

```bash
docker compose up -d
```

Acces pgadmin on `http://localhost:5050`. Note that Email/Username and password are defined in the docker-compose.yml file

Prepare the databse migration:

```bash
pnpm run db:generate
```

Warning: do not use `pnpm drizzle-it generate:pg` directly! We use Flyway to migrate the DB, but Flyway requires special naming convention for the `.sql` migration files, so this generate step rename the files that drizzle generates. There is an [opened issue](https://github.com/drizzle-team/drizzle-orm/issues/852#issuecomment-1646238813) in Drizzle repo to enable customizing filenames directly in drizzle-kit config.

Potentially modify generated `.sql` files before actually migrating.

Migrate the PostgreSQL schema according to `flyway.conf` config:

```bash
pnpm run db:migrate
```

At this stage, you should have a docker container running, have access to the the pgadmin home page and have a with correct schema's.

## Running the api

```bash
# Development with fail-closed Email Updates defaults
pnpm start:dev

# Normal repository development with Email Updates and its SNS simulator enabled
make dev-api

# production mode
pnpm build && pnpm start
```

`make dev-api` explicitly sets `NODE_ENV=development`, enables Conversation
Email Updates, disables its kill switch, and enables the development-only SNS
simulator. Direct API startup keeps the application defaults: Email Updates
disabled, kill switch active, and simulator disabled. The API rejects simulator
startup outside development, so production and staging must configure their
delivery gates explicitly and cannot inherit the local simulator behavior.

## Phone country policy

`PHONE_AUTH_MODE` is a global upper bound. `disabled` stops phone authentication;
`login_only` permits eligible existing credentials only. With global `enabled`,
new phone enrollment is still limited by `PHONE_REGISTRATION_ALLOWED_COUNTRIES`.
This includes attaching a new phone to an existing email/Rarimo account.

The backend derives the country from the submitted international number, not the
client's selected country or its calling-code hint. It enforces the policy on
initiation, resends, and completion; an older OTP cannot bypass a newly closed
registration policy. Guest participation can still merge into an eligible existing
phone account after proof of control. Phone blocks and account restrictions remain
authoritative, including before delivery.

`PHONE_AUTH_ALLOWED_COUNTRIES` and `PHONE_REGISTRATION_ALLOWED_COUNTRIES` accept
comma-separated ISO country codes and are validated at startup. The canonical
country defaults live in
[`phone-country-policy.ts`](../shared/src/types/phone-country-policy.ts).

The registration list must be a subset of the authentication list. An explicitly
empty registration list closes enrollment everywhere. Authentication-only
destinations stay login-only when global registration reopens. All destinations
outside the authentication list are disabled. These are reviewed deployment
settings, not rules dynamically inferred from account counts.

Twilio Geo Permissions must allow SMS **with Fraud Guard** for all authentication
destinations, including login-only ones. Disable other SMS destinations and unused
Voice verification. Safe List exceptions can bypass Twilio Geo/Fraud Guard rules;
the API's country policy is independently enforced.

`POST /api/v1/auth/phone/policy` accepts `{}` and exposes only the global mode and
country rules. It does not accept a phone number or disclose accounts, quotas, or
spending. The frontend caches these rules and filters login versus enrollment
country pickers. Build with `VITE_PHONE_AUTH_MODE=enabled` to let the backend control
registration availability at runtime; a frontend build set to `login_only` remains
an additional presentation restriction and must be rebuilt to reopen enrollment.

Both active modes use response padding (default 2 seconds plus up to 500 ms jitter),
synthetic challenges for ineligible destinations/accounts, detached delivery, and
matching API-controlled wrong-guess/expiry handling. `THROTTLE_SMS_SECONDS_INTERVAL`
defaults to 30 seconds, shared by destination across requesting devices.

## Phone SMS budget defaults

After the migrations, a missing `phone_sms_budget_policy` is initialized automatically
and shared by all API instances. No manual policy insert is needed for new defaults:

| Setting                             | Default                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| Monthly estimated-spend ceiling     | **US$100** (`10000` cents)                                     |
| Warning / new-enrollment pause      | **75%** (US$75 for the default policy)                         |
| Reservation cost                    | Conservative destination estimate, with a 15-cent policy floor |
| Hourly/daily send and spending caps | Unset (`NULL`); optional operator limits                       |
| Monthly period                      | UTC calendar month, resetting at 00:00 UTC on the first        |

Normal bursts can use remaining monthly capacity. Optional burst limits are global
rolling-hour/24-hour caps. Every send/resend reserves capacity under a writer-side
database lock before calling Twilio; failed/uncertain deliveries retain their debit.
Existing login can use the allowance after a warning until its next reservation
would exceed a hard cap. Already-issued login OTPs remain verifiable during a budget
pause. Enrollment is rechecked against the writer policy after provider approval.

Automatic registration pauses expire at the next UTC month boundary and recheck
usage. Manual pauses with no `registration_pause_expires_at`, static global
restrictions, country login-only rules, and account/phone blocks do not expire with
the monthly reset. Clear both pause fields when deliberately reopening a manual pause.

Destination estimates are source-controlled in `src/service/phoneSmsPricing.ts` using
the October 2026 [Twilio SMS price CSV](https://assets.cdn.prod.twilio.com/pricing-csv/SMSPricing.csv).
They reserve **two segments**, the US$0.05 successful-Verify fee on every attempt,
and **20% headroom**, rounding up to whole cents. A 15-cent floor gives inexpensive
routes extra room. There are no live pricing calls in the authentication path.

`PHONE_SMS_COST_CENTS_BY_COUNTRY` accepts reviewed JSON integer-cent overrides, e.g.
`{"FR":30}`. Adding a destination without a built-in rate requires an explicit cost
override. Reservations use the greater of the destination estimate and the persisted
`estimated_cents_per_send` floor, preserving more conservative operator settings.
Past reservations keep their original estimates when pricing changes.

This limits **estimated application spending**, not the exact invoice. Reconcile
actual Verify prices, message segments, additional fees, taxes, and any earlier
unbudgeted/underestimated usage before reducing estimates. The read-only planner is
optional for custom burst/forecast limits; its default monthly ceiling is US$100.

Defaults only affect missing policies. Existing configured limits and shutdowns are
preserved. V0098.1's legacy backfill assigns US$30 to previously enabled zero-default
policies; V0099 changes the default for newly created policies to US$100. To adopt
the approved US$100 limit on an existing row, run this deliberate writer update:

```sql
UPDATE phone_sms_budget_policy
SET monthly_budget_cents = 10000, warning_percent = 75, updated_at = clock_timestamp()
WHERE id = 1;
```

This does not clear pauses or enable a disabled policy. `PHONE_SMS_BUDGET_ALERT_EMAIL`
enables retryable SES alerts; ensure the configured region/sender can deliver to it.

### Production rollout

1. Build and pull updated **api** and **agora** images. Previously built images do not
   include the country policy or revised pricing.
2. Stop old API/import notification writers before running unrestricted Flyway
   migration (`docker compose -f docker-compose-production.yml stop api import-worker`).
   Otherwise use the staged notification-constraint rollout described in PR #1270.
3. Run the usual production-writer `pnpm db:migrate`, including V0097, V0098,
   V0098.1 and V0099. Retain the existing peppers and cloud/provider credentials.
4. Start the updated services with `PHONE_AUTH_MODE=disabled` while applying the
   reviewed incident restrictions. Use the normal `update-agora.sh` deployment helper.
5. Run the operator importer from `services/api` with production writer settings:
   `NODE_ENV=production pnpm exec tsx scripts/import-blocked-phones.ts /private/path/reviewed.json --apply`.
   The private file is an operator artifact, not a repository file. The standalone
   importer does not inherit Compose environment values; load your operator env file
   with `tsx --env-file=...` or provide the normal writer/AWS settings in the shell.
6. Set Twilio SMS Geo Permissions to **Monitor all traffic for blocking fraud** for
   the configured authentication countries. Keep other destinations disabled and
   preserve eligible existing-user access while restricting the reviewed incident
   credentials individually.
7. Inspect any existing budget row and apply the US$100 update above if desired.
   Re-enable `sending_enabled` only if its existing shutdown is ready to be lifted.
8. Deploy/restart the API with `PHONE_AUTH_MODE=login_only`, production Turnstile
   enforcement for `agoracitizen.app`, and the alert recipient. New policies initialize
   at US$100; existing settings remain authoritative. Verify login, resend, and alerts.
9. When ready for new phone enrollment, set only the API's global mode to `enabled`
   (and rebuild a frontend that was explicitly capped at `login_only`). Country
   registration restrictions remain in force.

Keep populated incident files private and preserve the frontend asset volume during
updates. The checked-in Compose file is a deployment example; use your actual image
tags, production secret injection, and existing SES/database/Valkey infrastructure.

## Logging privacy

The API uses schema-projected request/error metadata, reviewed message templates,
and a final Pino output projection. See
[the shared logging guide](../shared-backend/LOGGING.md) for the policy, typed
event API, diagnostics behavior, and regression checks.

## Moderation

To grant a user moderator status, set the `is_moderator` column to true in the `user` table for the selected user.

## Integrations

### MaxDiff GitHub Connector

The MaxDiff/BWS GitHub connector uses `GITHUB_ACCESS_TOKEN` for issue preview and sync requests.

Production tokens must be GitHub fine-grained personal access tokens with these constraints:

- Repository access: only `zkorum/agora`
- Permissions: read-only `Issues` and read-only `Metadata`
- No write permissions
- No access to other repositories

`GITHUB_WEBHOOK_SECRET` and `GITHUB_ACCESS_TOKEN` must either both be set or both be unset. Configure production values as deployment secrets, not in committed files.

Connector usage is additionally gated by `IS_MAXDIFF_GITHUB_ORG_ONLY`, `MAXDIFF_GITHUB_ALLOWED_ORGS`, and `MAXDIFF_GITHUB_ALLOWED_USERS`; these control which Agora users or organizations may use the connector, not which GitHub repositories the token can access.

### AI Suggestions for Seed Statements

On the Add Seed Statements page, authors can ask a model for statements drawn from the conversation's title and description (`POST /api/v1/conversation/seed/generate`). The request also carries the statements already on the page, both those the author wrote and the suggestions shown before, so that new suggestions differ from them; suggestions repeating one of them are dropped. A description over the limits that apply when publishing (5,000 characters) is refused before any model call. Code: `src/service/seedSuggestion*.ts`. How the prompt was chosen and evaluated: `experiments/initiatives/seed-opinions/seed-opinions-description.md`.

- **Model**: Mistral Large 3 on AWS Bedrock (Converse API). In production the API's AWS role needs `bedrock:InvokeModel` on that model only (`AI_SUGGESTIONS_BEDROCK_MODEL_ID` in `AI_SUGGESTIONS_BEDROCK_REGION`, default `us-east-1`), not on all of Bedrock. Locally, normal AWS credentials or a Bedrock API key in `AWS_BEARER_TOKEN_BEDROCK` work; never commit a key.
- **Source**: `AI_SUGGESTIONS_SOURCE=bedrock`, or `simulated` for canned answers with no model call. Production refuses `simulated`. With `simulated`, the keywords `simulate:not-confident`, `simulate:failure` and `simulate:slow` in the conversation title select the other cases.
- **Access**: `AI_SUGGESTIONS_ENABLED` (off by default), `IS_AI_SUGGESTIONS_ORG_ONLY`, `AI_SUGGESTIONS_ALLOWED_ORGS` and `AI_SUGGESTIONS_ALLOWED_USERS`, checked with `checkFeatureAccess`. The frontend's `VITE_AI_SUGGESTIONS_ENABLED` only shows the button; keep both in step.
- **Tuning**: `AI_SUGGESTIONS_TEMPERATURE` (0.3), `AI_SUGGESTIONS_TIMEOUT_MS` (30000) and `AI_SUGGESTIONS_PROMPT` (replaces the built-in system prompt). Generations are limited to 5 per minute per user, counted per API instance. A Bedrock call with no answer after 12 seconds is tried once more, within the overall timeout (about 1 call in 20 got no answer in testing).
- **Usage**: each generation and each suggestion added writes a log line starting with `AGORA_AI_SUGGESTION_EVENT`, followed by JSON with identifiers, a random draft identifier, source, model, duration and confidence. No title, description or suggestion text is logged. Locally: `grep AGORA_AI_SUGGESTION_EVENT .local/logs/latest/api.log`.
- **Switching off**: set `AI_SUGGESTIONS_ENABLED=false` (and `VITE_AI_SUGGESTIONS_ENABLED=false` to hide the button).

### LLM Integration

LLM Integration cannot be tested locally by design, since it relies on an external cloud service and running a model locally is expensive.

To visualize how it works, checkout the staging environment.

### CSV Export Feature

The API provides a conversation export feature that allows users to download conversation data (opinions and votes) as CSV files. Exports are stored in AWS S3 with secure pre-signed download URLs.

#### Environment Variables

**Required for CSV export:**

```bash
# S3 bucket configuration
EXPORT_CONVOS_AWS_S3_REGION=us-east-1                      # AWS region for S3 bucket
EXPORT_CONVOS_AWS_S3_BUCKET_NAME=agora-conversation-exports # S3 bucket name

# Optional configuration (with defaults)
EXPORT_CONVOS_EXPIRY_DAYS=30                               # Days until exports auto-delete (default: 30)
EXPORT_CONVOS_COOLDOWN_SECONDS=300                         # Cooldown between exports for same conversation (default: 300s/5min)
EXPORT_CONVOS_S3_PRESIGNED_URL_EXPIRY_SECONDS=3600         # Presigned URL validity (default: 3600s/1 hour)
EXPORT_CONVOS_ENABLED=true                                 # Enable/disable export feature (default: true)

# Optional: Valkey for export queue persistence across instances
QUEUE_VALKEY_URL=redis://localhost:6379                          # If not set, uses in-memory storage (lost on restart)
```

**Export Queue System:**

The export feature uses a queue system to manage load:

- Requests are batched and processed every 1 second (configurable batch size: 100)
- Duplicate requests within the same batch are automatically filtered
- Cooldown prevents re-exporting the same conversation too frequently
- Individual export failures don't affect other exports in the batch
- Valkey persistence (optional) enables queue survival across server restarts

**AWS Credentials:**

The application uses the AWS SDK default credential provider chain, which checks (in order):

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Shared credentials file (`~/.aws/credentials`)
3. IAM role attached to EC2 instance (recommended for production)
4. ECS task role (for containerized deployments)

**For production**, use IAM roles attached to your EC2 instance or ECS task. **For development**, you can use environment variables or the shared credentials file.

#### IAM Permissions

The IAM role or user must have the following S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::agora-conversation-exports/*",
                "arn:aws:s3:::agora-conversation-exports"
            ]
        }
    ]
}
```

#### S3 Bucket Setup

**Using AWS CLI:**

```bash
# Create bucket (us-east-1 requires no --create-bucket-configuration)
aws s3api create-bucket --bucket agora-conversation-exports --region us-east-1

# Enable default encryption (SSE-S3)
aws s3api put-bucket-encryption --bucket agora-conversation-exports \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Block public access (security best practice)
aws s3api put-public-access-block --bucket agora-conversation-exports \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Set lifecycle policy (auto-delete after 30 days - should match EXPORT_CONVOS_EXPIRY_DAYS)
aws s3api put-bucket-lifecycle-configuration --bucket agora-conversation-exports \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "DeleteOldExports",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "exports/conversations/"
      },
      "Expiration": {
        "Days": 30
      }
    }]
  }'
```

**Using AWS Console:**

1. Go to S3 console and create a new bucket
2. Enable "Block all public access"
3. Enable "Default encryption" with SSE-S3
4. Create a lifecycle rule to delete objects after 30 days in the `exports/conversations/` prefix

#### Disabling CSV Export

To disable the CSV export feature entirely:

```bash
EXPORT_CONVOS_ENABLED=false
```

When disabled, export API endpoints will return 404 Not Found.

### Project Document Storage

Project documents use a dedicated private S3 bucket. Do not reuse the
conversation export bucket: export lifecycle rules delete objects after 30
days, while project documents remain available until an administrator removes
them.

Create one bucket per deployment environment, enable S3 Block Public Access
and default encryption, and leave static website hosting disabled. Do not add
an expiry lifecycle rule for the `projects/` prefix.

Configure the API deployment with:

```bash
PROJECT_DOCUMENTS_AWS_S3_REGION=us-east-1
PROJECT_DOCUMENTS_AWS_S3_BUCKET_NAME=agora-project-documents-production
PROJECT_DOCUMENTS_S3_PRESIGNED_URL_EXPIRY_SECONDS=600
```

The API role needs the following policy, with the bucket name changed for the
deployment environment:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::agora-project-documents-production"
        },
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::agora-project-documents-production/projects/*"
        }
    ]
}
```

The API uploads objects under
`projects/<project-id>/documents/<document-id>/participant` and
`projects/<project-id>/documents/<document-id>/owner`. S3 remains private; the
API checks access before issuing a short-lived presigned download URL. The API
also checks bucket access during startup when both project-document S3
variables are configured.

Project and project-conversation responses contain `documents[].versions` with a
required `participant` entry and an optional `owner` entry. Owner metadata is
included only for a verified, eligible requester with `project_update` capability.
Each version carries its literal audience and content type. Owners can access
both versions independently; the owner file never replaces the participant file.
Document access requests must specify `audience: "participant" | "owner"`, and
authorization is checked again before signing that exact file. A missing owner
file returns 404 rather than falling back to the participant version.

HTML uploads are normalized using `parse5` before storage. A CSP at the start of
`<head>` permits only the uploaded inline scripts by SHA-256 hash, blocks inline
event-handler attributes, and restricts external resources and network APIs.
Inline styles and embedded data images/fonts remain available. Declarative
external links and refresh redirects are removed. Interactive reports run with
`sandbox="allow-scripts"`, never `allow-same-origin`, forms, or popups. Email
previews remain script-free. PDF previews use the native browser viewer.

Only trusted reports should be uploaded: an authorized script can still navigate
its own iframe, so these restrictions are not a guarantee of zero network egress.
The database's `html_scripts_enabled` flag defaults to false. Existing HTML stays
script-free until reuploaded through the new normalization path. Uploads support
50 MiB per file (including the normalized policy); owner downloads receive an
`-owner` filename suffix to distinguish them from participant downloads. Uploading
both versions can total 100 MiB plus multipart overhead, so the reverse proxy's
request-body limit must accommodate the combined request.

## Test

```bash
# unit tests
pnpm run test
```

## Troubleshooting

### "Backend is stale" / Requests pending in development

If you observe that backend requests are hanging or the UI reports the backend is "stale" while running locally, you likely hit the **browser's connection limit**.

- **Cause:** Browsers limit the number of persistent connections per domain (typically 6 for HTTP/1.1).
- **Context:** The local dev server runs on HTTP/1.1. Since each app tab opens a persistent SSE connection for notifications, opening **6 or more tabs** consumes all available sockets. Subsequent requests from any tab will queue indefinitely.
- **Solution:**
    - Close unused tabs (keep open tabs < 6).
    - Use a different browser (Chrome, Firefox, Safari each have their own pool).
    - Access the app via `127.0.0.1` for a second set of connections (treated as a different origin than `localhost`).
- **Note:** This issue does not affect staging/production environments that use HTTP/2 (which supports multiplexing).

## License

See [COPYING](COPYING)
