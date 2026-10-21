# Dependency and GitHub security review — 2026-10-21

## Scope and baseline

Reviewed `zkorum/agora` using authenticated GitHub APIs, including every page of
open Dependabot and CodeQL alerts, open dependency PRs, and local package audits.

- GitHub baseline: **165 dependency alerts** — 3 critical, 98 high, 60 medium,
  4 low.
- CodeQL baseline: **153 alerts** — one critical SSRF report, 141 missing-rate-limit
  reports, and 11 other reports.
- No open secret-scanning alerts or repository security advisories were returned.
- The open PR list contained 65 Dependabot PRs at the final inventory. Some target
  deleted services or versions already superseded locally.

Changes are local. GitHub alerts and PRs still need to be reconciled after these
changes reach the default branch. A clean package audit does not close CodeQL
reports or establish that every dependency is safe.

## Implemented upgrades

| Area | Applied version / action | Rationale |
| --- | --- | --- |
| HTML sanitization | `sanitize-html` 2.18.1 in agora, API, shared-app-api, email worker, and load-testing | The PR target 2.17.7 is still affected by newer advisories. |
| Rich-text editor | All seven direct Tiptap packages at 3.30.5; floating-menu pinned to the same version; ProseMirror packages aligned and `prosemirror-view` patched | Fixes Markdown ReDoS, attribute prototype injection, and paste XSS. A core-only upgrade introduced incompatible peers; mixed ProseMirror models broke list editing until aligned. |
| Frontend framework | Quasar 2.22.0 → 2.23.3 | Fixes the high-severity SSR User-Agent ReDoS. The later low-severity `openURL` issue is deferred below. |
| Vue | Agora 3.5.44; API/email worker 3.5.42 | Includes the server-renderer attribute escaping fix. |
| HTTP client | Axios 1.20.0 in agora/API; patched `follow-redirects` | Existing Axios PR targets are insufficient for current advisories. |
| API framework | Fastify 5.12.7 in API/shared-backend | Same-major patch upgrade. |
| Email transport | Nodemailer 10.1.2; named `Transporter` type import; removed obsolete `@types/nodemailer` | Version 9 is still vulnerable. The runtime floor is already compatible. SESv2 transport was smoke-tested with a mock client. |
| JS tooling | Vite 8.3.4 and Vitest 4.1.12 across the affected TS services | Includes security fixes newer than the old PR targets. |
| Landing telemetry | Sentry SvelteKit 10.76.2 and its updated instrumentation dependencies | Same-major upgrade removes the older OpenTelemetry audit findings. |
| JS transitive dependencies | Patched compatible releases of PostCSS, brace-expansion, fast-uri, busboy, gRPC, undici, source-map-js, browser metadata, DOMPurify, etc. | Updated within parent constraints; corrected stale shared-backend security overrides. |
| Pinned transitive JS dependencies | Same-major overrides for `ws`, `compression`, `qs`, and DiceBear initials | Their parents still pin vulnerable releases. Overrides are narrow and documented in the workspace configs. |
| Python production workers | cryptography 50.0.2, pyasn1 0.6.4, pydantic-settings 2.16.0, urllib3 2.8.0, idna 3.20 where present | Resolves the corresponding GitHub worker alerts. |
| Import code generation | datamodel-code-generator 0.64.0, with manifest floor raised | Fixes the reported code-generation injection, local-file reference, and SSRF issues without taking the much larger current generator release. |
| Scoring utilities | pytest 9.1.1, fsspec 2026.9.0, patched HTTP/settings dependencies | Keeps the GPU stack separate from routine worker upgrades. |
| Experiments | MLflow 3.17.2, GitPython 3.1.62, AnyIO 4.15.1, cryptography 50.0.2, aiohttp 3.14.5, Mako 1.4.3, Werkzeug 3.1.9, multidict 6.9.1, sqlparse 0.6.0, urllib3 2.8.0 | Addresses all three critical GitHub dependency alerts and the other reported experiments dependencies. MLflow is outside the currently reported affected range for the gateway issue that has no first-patched version recorded. |
| Experiments image handling | Pillow 13.0.0 | A local Python audit found eight additional native image-decoder issues requiring this major upgrade; MLflow imports and an image round-trip pass. |

The shared-app-api test suite now uses Vitest, matching the API and shared-backend.
Jest could not load the patched sanitizer's CommonJS-to-ESM dependency boundary.
All 15 existing tests were retained. Removed Jest/ts-jest, the deprecated
`@types/eslint__js` stub, and the misspelled `typecript` placeholder dependency.

Load-testing now declares the sanitizer used by its synced rich-text code; its
build previously failed to resolve that import.

Release-age protection was retained for these upgrades. Newer Quasar/Nodemailer
releases inside the five-day window were not needed to obtain patched versions.
Independent TLS/CA remediation changes present in the workspace are tracked in
`doc/tls-ca-remediation-2026-10.md`.

## Critical application-code report addressed

[CodeQL #61](https://github.com/zkorum/agora/security/code-scanning/61) identifies
user-influenced GitHub importer request URLs.

`services/api/src/service/externalSource/github.ts` now parses an exact
`owner/repository` pair at the network boundary, rejects traversal and URL syntax,
encodes path segments, constructs query parameters separately, and refuses
redirects. The hostname remains the fixed GitHub API origin. Renamed or moved
repositories must use their canonical name instead of relying on redirects.

Regression tests cover malformed repositories, traversal, query/fragment
injection, absence of outgoing requests for rejected input, and redirect policy.
GitHub must rerun CodeQL before this report can be considered closed remotely.

## Remaining upgrade plan

### P1 — next focused security changes

1. **Quasar CLI/App Vite 2 → at least 3.3.0.** Four original GitHub alerts
   remain: #996–#999 (build cleanup, CSP nonce handling, SSR error disclosure,
   development TLS key permissions). This requires reviewing the CLI migration,
   generated configuration/types, build cleanup paths, SPA routing, and centralized
   browser-compatibility integration. Run the complete frontend tests and both
   staging/production builds; verify generated certificate permissions. The shipped
   application is an SPA, which limits exposure to the SSR-only issues, but does
   not resolve the development-key or build-tool findings.
2. **POD/GPC dependency chain: Valibot 0.42.1 → patched compatible integration.**
   API and agora still inherit high-severity Valibot findings through `@pcd/gpc`.
   Prefer a parent update or reviewed fork supporting Valibot 1.4.2+; do not force
   a major validation-library replacement beneath cryptographic proof code.
   Verify valid/invalid PODs, ticket authentication, proof verification, and error
   handling in both consumers. Coordinate the remaining UUID dependency with this
   work; its advisory involves caller-supplied output buffers.
3. **Landing-page Sharp 0.34 → 0.35.5+.** `@sveltejs/enhanced-img` 0.10.4 and
   vite-imagetools still constrain the native image dependency. Upgrade the parent
   integration or review a targeted override. Validate AVIF/WebP/JPEG generation,
   responsive-image output, and the Netlify build on Linux. Avoid processing new
   untrusted images with the old build pipeline while this is pending.

### P2 — coordinated or lower-exposure upgrades

4. **Quasar runtime → 2.32.2+.** Original GitHub alert #1000 is low severity and
   concerns DOM clobbering in the SafariViewController `openURL` integration.
   Testing 2.32.2 found changed backdrop dismissal, changed `aria-describedby`
   output, and a new scrolling path unsupported by jsdom. Update and verify the
   actual component behavior in a browser, then adapt the component tests using
   appropriate test tooling. The smaller 2.23.3 security upgrade passes all tests.
5. **PyTorch + setuptools together** ([PR #1154](https://github.com/zkorum/agora/pull/1154),
   [PR #1166](https://github.com/zkorum/agora/pull/1166)). The remaining original
   alerts are #678 (low, TorchScript) and #721 (medium, setuptools sdist handling).
   Resolving setuptools 83+ with torch 2.11.0 fails because torch requires
   `setuptools<82`. Upgrade Torch to at least 2.13.0, then setuptools to 83+;
   validate Solidago numerical results, GPU/CUDA compatibility, and the Linux GPU
   image. Keep CPU/GPU dependency checks separate: a clean CPU environment audit
   does not cover the optional GPU packages in `uv.lock`.
6. **Remaining tooling transitive findings.** Track unpatched `braces` in frontend
   glob tooling and `sprintf-js` through gray-matter; update parents when fixes
   exist. Review major replacements for KaTeX (API/shared-app-api lint tooling),
   postcss-selector-parser 6 → 7 (Tailwind typography), and any remaining esbuild
   pre-1.0 minor boundary. These are not reasons to force incompatible versions
   globally.
7. **Other major-version PRs:**
   - `uint8arrays` 5 → 6 (#1078, #1112, #1153) and API `cborg` 4 → 5 (#972):
     coordinate UCAN byte encoding/signing and cross-service interoperability;
     run authentication and load-test signing checks.
   - API `marked` 17 → 18 (#971): verify GitHub Markdown conversion, sanitizer
     integration, and rich-text limits.
   - API `@fastify/multipart` 9 → 10 (#969): verify upload limits, malformed
     multipart requests, and import behavior. The current busboy dependency has
     already received its compatible security fixes.
   - `prettier-plugin-svelte` 3 → 4 (#1141): review output changes separately from
     application edits and run landing formatting/type/build checks.
   - TypeScript 7 (#1170): migrate the compiler/tooling matrix and shared-source
     consumers together. Node 26 type PRs (#1190, #1212) should be reconciled with
     the actual Node 22/24 deployment contract instead of automatically widening
     the APIs TypeScript permits.
   - API `@eslint/js` 10 (#968): the attempted upgrade enables rules that flag
     existing error-cause and assignment patterns, including generated shared
     code. Fix canonical sources and synchronize them before enabling those rules.

## PR reconciliation after landing

Close superseded PRs only after verifying the default-branch lockfiles and a new
security scan. Representative groups:

- Sanitizer #1228–#1231; Tiptap #1243; Fastify #1232/#1233; Vitest #1245;
  SvelteKit #1188; Vite #1100–#1104; Axios #1159/#1160; Nodemailer #1106;
  fast-xml-builder #1037; PostCSS #997/#998/#1017; brace-expansion #1060;
  devalue #1051; API Markdown lint plugin #973.
- Python cryptography #1107/#1108/#1185/#1235; pyasn1 #1161–#1165/#1180;
  datamodel-code-generator #1175; idna #1061/#1073/#1085; urllib3 #1048;
  pytest #974.
- #1128 proposes pnpm 10, while the repository already declares 12.4.1.
  #962's deprecated ESLint type stub was removed because the package supplies its
  own types.
- #978/#981/#1033/#1056/#1063 target removed TypeScript math-updater manifests.
  #954–#957/#959 target the removed python-bridge service. Inspect their files and
  close as obsolete; do not recreate retired service manifests to satisfy them.
- Retain the deferred major-upgrade PRs above or replace them with coordinated
  changes that meet the newer patched-version requirements.

For prevention, extend Dependabot coverage to shared-backend, the email worker,
all Python worker/shared-library projects, and experiments; group Tiptap packages
together and audit maintained security overrides regularly. Inspect the current
Dependabot configuration before changing it: its version-update entries do not
cover all of the services that now receive security-only PRs.

## Remaining CodeQL triage

| Reports | Assessment and next action |
| --- | --- |
| 141 missing-rate-limit reports | The API registers rate-limit with `global: false`. Some routes have explicit limits or service-level controls; review route coverage, shared Valkey limits, authentication, and expensive operations before deciding which reports are false positives. Prioritize unauthenticated and resource-intensive endpoints; do not blanket-dismiss. |
| #53–#57 HTML sanitization | The cited helper produces fallback plain text for counting, rather than sanitized HTML. Trace consumers and rendering sinks, document that distinction, and dismiss only with evidence or fix any unsafe sink. |
| #58/#59 insecure randomness | Located in load-test vote/user simulation. Confirm those values never become production security tokens; document as test-data randomness. |
| #60 log-marker regex ReDoS | Replace ambiguous escaped-string parsing with a linear parser and test long malformed/truncated log records. |
| #47/#48 schema-sync regex ReDoS | Build-time source processing; replace ambiguous repeated-comment regex parsing and add adversarial-input coverage. |
| #197 script end-tag regex | This is the soft-delete source scanner, not a web sanitizer. Improve script extraction with a parser so unusual valid end tags cannot omit code from the policy check. |

## Verification

Final `pnpm audit` snapshot (including development/optional dependencies):

| Service | Critical | High | Moderate | Low |
| --- | --- | --- | --- | --- |
| agora | 0 | 7 | 3 | 2 |
| api | 0 | 1 | 2 | 1 |
| app | 0 | 3 | 2 | 0 |
| conversation-email-update-worker | 0 | 0 | 0 | 0 |
| shared-backend | 0 | 0 | 0 | 0 |
| shared-app-api | 0 | 0 | 0 | 1 |
| load-testing | 0 | 0 | 0 | 1 |

The deferred items above account for these findings; they are distinct from the
GitHub manifest-alert baseline and must not be added to it as unique issues.

| Component | Result |
| --- | --- |
| Agora | 214 test files / 1,576 tests pass; `vue-tsc --noEmit` passes; `build:dev` succeeds; lint has one unrelated existing Vue-prop warning. |
| Landing | Typecheck clean; 83 unit tests pass; production/Netlify build succeeds, including the Sentry upgrade. |
| API | Typecheck and build pass; full suite: 1,388 pass and one 5-second merge-account timeout. That entire 19-test file passes when rerun alone. SSRF/rich-text tests pass; changed application files lint clean. |
| Email worker | Typecheck, lint, production-build assertion, and all 275 tests pass. |
| shared-backend | All 36 tests pass; package audit clean. |
| shared-app-api | All 15 tests pass with the patched sanitizer; new test configuration/tests lint clean. |
| Load-testing | All 26 unit tests and bundle build pass. No live load test was run. |
| Import worker | 43 tests pass. |
| Math updater | 9 tests pass. |
| Shared analysis worker | 266 tests pass, 3 skipped; Python audit clean. |
| Content translation worker | 54 tests pass. |
| AI description retry worker | 7 tests pass. |
| Description translation retry worker | Typecheck and module import pass; this project does not declare a pytest suite. |
| Scoring worker | 129 tests pass; installed CPU environment audit clean. Optional GPU findings remain as explained above. |
| Experiments | MLflow GenAI API imports and Pillow image round-trip pass; installed-environment Python audit clean. No paid-provider experiment or existing tracking-database migration was run. |

Full API lint still reports an unnecessary conditional in the independently
modified `src/index.ts` (line 5485 at review time). Full shared-app-api lint reports
four unresolved-type errors in `src/html.ts`, whose source imports use the synced
consumer layout. These were not suppressed; the changed-file lint checks pass.

Python verification used `uvx --from uv==0.13.4 uv ...` where required by the
workspace's concurrent TLS remediation changes, without changing the globally
installed uv. Lockfiles were generated with the package managers; generated shared
source copies were not hand-edited for this dependency work.

Deploy the updated landing, agora, API, email worker, and affected Python worker
images after review. Recreate the experiments environment from its lockfile.
