# Visitor and usage analytics

## What the owner can see

- Visitor estimates, page views, referral sources and device/country breakdown: [Vercel Sitebrief → Analytics](https://vercel.com/circuitstudioais-projects/sitebrief/analytics). Collection begins after the instrumented production release. Historical traffic cannot be recovered by adding a tracker.
- Usage: anonymous daily action totals in the existing `sitebrief-quota` Free Redis database. Data Browser keys are `sitebrief:usage:v1:production:YYYY-MM-DD`. Preview data uses a separate `preview` namespace.
- For an aggregate report, with the existing Redis server variables available privately: `VERCEL_ENV=production ANALYTICS_REPORT_DAYS=7 npm run analytics:report`. Do not put a token into command-line arguments, source control or a browser. The script accepts 1–31 days and prints only daily aggregate counts. These custom totals are **not** shown in Vercel's Events panel on Hobby.

## Metrics and meaning

Field format: `event:workflow:mode`.

- Events: `analysis_started`, `analysis_completed`, `analysis_failed`, `pdf_downloaded`, `notes_downloaded`.
- Workflows: `scout`, `explore`, `compare`.
- Modes: `sample`, `custom`. Sample is an explicit example-button run or the fictional comparison. It may use live evidence, cache or saved fallback; this dimension is not a claim of fresh provider execution.
- Starts happen after client validation, before the actual request. Completion requires a successful comparison/map response or the complete scouting stream. An intermediate streamed map is not completion. Errors have no arbitrary error text in analytics.
- Downloads are recorded after the export action succeeds locally; this does not prove the user opened or read the file.
- `_total` counts all stored usage events that day, not visits, people or completed analyses. Events do not have user/session identifiers. Repeated actions count again. Do not calculate a unique-user conversion rate by dividing independent counters.

## Free-plan bounds and privacy

Vercel Hobby Web Analytics has a free included allocation; custom events require Pro. No Pro upgrade, Analytics Plus, session replay or additional storage subscription is added. Action totals reuse the existing Free Redis resource, with its auto-upgrade disabled.

Pageviews are mounted once in the shared production layout, covering `/` and `/compare`. Query strings, fragments and unknown paths are removed/refused before submission. Preview pageviews and automatic usage tracking are off. Browser Do Not Track disables both client trackers. No cookies or local/session storage are added by this change. No prompts, restaurant names, addresses, coordinates, source excerpts, emails, identities, IPs or custom error strings enter the usage payload or aggregate store. Vercel performs its own anonymous visitor estimation; refer to its privacy documentation for the provider's processing.

The custom endpoint accepts only three fixed enum fields and same-origin JSON, bounds the actual request stream to 256 bytes, and never returns stored totals publicly. Origin checking is not authentication or fraud prevention. Bots can fabricate events; analytics is directional product usage, not billing or customer validation.

Writes are atomic, capped at **1,000 usage events per UTC day per environment**, and expire **35 days after the last write to that daily key**. After the cap, telemetry is dropped with429. Redis errors return503; client tracking is best effort and never interrupts the product. DNT, blockers, network loss and caps can undercount. Day labels use the application's UTC clock; these are not financial-period records. No analytics key touches the live-analysis quota key, and no local counters replace shared quota protection.

## Verification and release

- Regression observed failing, then passing: URL minimization and finite aggregate-only event writes. Route contracts cover origin denial, actual-byte bounds, private-field rejection, stored202, cap429 and sanitized503.
- Full suite:174 tests; lint and production build pass.
- Browser behavior: saved scouting replay, deterministic sample comparison, PDF/notes exports, failed comparison and DNT. Nine allowlisted events observed with mocked analytics transport; no paid provider calls. Provider collection and historical dashboard totals are separate evidence.
- Reproduce: `PLAYWRIGHT_MODULE_PATH=/path/to/playwright node --import tsx scripts/verify-analytics.mjs http://localhost:PORT` after a production-mode build with `VERCEL_ENV=production`. The browser harness mocks provider analytics and usage writes; it is not a live Redis receipt. Keep raw receipts outside Git.
- Deployment/real store receipts are recorded in the PR. Do not claim live production collection until the approved production release and actual browser collection checks pass.

Disablement: turn off Web Analytics in the Vercel project and deploy without `SiteAnalytics` / client calls if needed. Retained aggregate keys expire naturally; never delete or reset the separate quota key.

References: [Vercel quickstart](https://vercel.com/docs/analytics/quickstart), [plan limits](https://vercel.com/docs/analytics/limits-and-pricing), [privacy](https://vercel.com/docs/analytics/privacy-policy).
