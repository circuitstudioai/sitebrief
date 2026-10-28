# Bounded submission release — October 24, 2026

## Owner decision

PM7115 approved a small readiness pass before PR10 merge and Production verification. This supersedes the earlier docs-only freeze. Do not expand into a general geographic engine. A new draft PR will carry source-bound locality, coverage and research-completeness improvements. Do not represent the current release as geographically accepted.

## Shipped contract

- Qloo audience mapping, deterministic ranking/ties, popularity floors, operator constraints and the locked visit point remain unchanged.
- Generated local summaries are withheld as complete fields, not rewritten by deleting inconvenient words. All four fields say local evidence is unavailable. This deliberately reduces research detail.
- HTTPS source links remain inspection material. Source proximity, freshness, commercial availability and suitability are not verified.
- The same release boundary applies to live HTTP/MCP, SSE events/completion, canonical cache, saved examples, legacy client rendering, notes, PDF and tentative verdicts. Historical free-text decisions are regenerated from deterministic ranking; practical-evidence quotes are removed.
- Canonical source-discovery reuse requires two distinct source links for the exact visit point. This is not the old three-field/two-source quality gate. Saved dates and cached/live labels remain intact. Custom failures never receive a canonical saved example.
- Upstash Redis admission is configured: 50 top-level live jobs per UTC day per environment, separate Preview/Production counters, atomic UTC rollover, fail-closed store errors/exhaustion. Not a hard provider billing ceiling. Per-visitor limits and MCP authentication remain deferred.
- The unused Toronto location helper and tests move to the follow-up; official negative locality observations remain historical receipts.

## Acceptance

Regression tests prove saved and fresh summaries were exposed before the fix and withheld afterward. Additional contracts cover source-only reuse, wrong-point rejection, legacy cached decisions, duplicate/unsafe links, provenance, original deterministic constraints, quotas and custom fallback isolation.

Preview and Production receipts will be recorded below after they are actually observed. A five-run source-only gate proves safe output/identity, not complete geographic research. A browser replay of a historical run proves presentation sanitation, not live retrieval. Actual browser requests are reported separately.

### Local acceptance

- 164 tests / 28 suites, lint and optimized Production build passed.
- Three regressions were observed failing before the boundary: historical saved prose, fresh grounded prose and agent-stream prose. All now pass.
- Historical run1 browser replay passed on the optimized local server: four withheld fields, tentative verdicts, source links/checklist, one-page PDF/exact point, notes, desktop/mobile accessibility, no overflow or page errors, stale-input invalidation. This is replay sanitation evidence, not a fresh provider run. Raw receipt: `/tmp/sitebrief-release-ui-local-20261024/summary.json`.

### Hosted Preview acceptance — application `03d17a4`

Exact Preview: https://collab-scout-j7751nbww-circuitstudioais-projects.vercel.app (`dpl_FhSNMWbioXt1M4LcGuGo8VZydgLa`), READY; both GitHub/Vercel checks passed.

- Five fresh, noncanonical full scout requests: **5/5 bounded release PASS**, no cache/saved substitutions. Each preserved exact final point identity and highest eligible rank, returned at least two source inspection links, and withheld all generated local fields/citations/provider HTML in streamed and final reports. This is not geographic/source-content acceptance. Raw: `/tmp/sitebrief-release-research-preview-20261024/summary.json`.
- Hosted historical-run browser replay passed the same sanitation, artifact and accessibility gates as local replay. Raw: `/tmp/sitebrief-release-ui-preview-replay-20261024/summary.json`.
- Actual browser request passed with a correctly labelled warm canonical source-discovery result (`cached=true`, `saved=false`); no response substitution. Source links, City questions, all four withheld fields, tentative verdicts, one-page PDF/point identity, notes, mobile/desktop accessibility, no overflow/page errors and input invalidation passed. Raw: `/tmp/sitebrief-release-ui-preview-live-20261024/summary.json`.
- The browser capture harness initially could not retrieve an SSE body through Chrome's resource-body interface. It now reads a clone of the actual fetch response without changing the response. This is a harness repair, not a product failure or invented fresh run.
- The receipt/harness continuation changes only docs/scripts. Application code remains exactly the tested `03d17a4` tree. Final-head deployment checks must pass before merge. Production remains a separate pending observation.

### Production handoff — merged PR10 `ee6d4f5`, October 24 16:17 UTC

- PR10 merged at 16:16:08 UTC as `ee6d4f575979144cf5c2ec8a00f4d9adde1e957e` (reviewed head `39ecac4`). Async merge UUID `3fd316bc-ceee-40fa-b397-da3e43daa1c9`; no rule bypass.
- Vercel Production `dpl_5y2u5LN5rpjpM9zPdfseb9m88Ghw` is READY for that exact merge SHA; the public alias https://collab-scout.vercel.app resolves to deployment `collab-scout-59na7beay-circuitstudioais-projects.vercel.app`.
- At 16:17:28 UTC, an actual un-intercepted Production browser request completed fresh (`cached=false`, `saved=false`) with the Blue Bottle lead, exact point, all four summaries withheld, source inspection/checklist, tentative verdicts, one-page PDF, notes, desktop/mobile accessibility/no overflow, no page errors and stale-input invalidation. Raw server reports were also checked for empty summary/citations and the release policy marker. This is a bounded submission-release check, not full locality or source-content acceptance.
- Raw receipts/screenshots/artifacts: `/tmp/sitebrief-release-ui-production-20261024/`.
- Separate draft follow-up: https://github.com/circuitstudioai/collab-scout/pull/11. The current Production demo does not depend on that PR. Do not enable local summaries until its geographic/source-content gates pass.
- Demo URL for the submission: https://collab-scout.vercel.app. No Devpost form was filed during this release task.
