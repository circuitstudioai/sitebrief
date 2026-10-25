# Urgent result clarity and practical visit plan — 2026-10-25

Owner: Abhi, Project Management message7156. This new specific repair request is separate from the completed 24-hour controller. MeterKit stays paused. Scope: diagnose and prepare a reviewable fix; no new Production promotion or merge inferred.

## Audience and decision

A restaurant operator knows the intended city, concept and a few audience-reference brands. The decision is where to visit first, not whether a business will succeed or a property is available. Inputs affect taste retrieval, radius, popularity floor and outlet exclusions; descriptive concept details do not invent Qloo scores.

## Observed defects and causes

Production base: main1a1206677573f971f2dc2ab303cb5364c4f23ed2. Queried Vercel production, no branch filter, last8h/serverless/60limit. Six entries returned; three structured research events report `partial`,10/14/15source links and1/1/2citations. Rules include numeric address/transit claims, missing sections and local-anchor failures. These are provider-stage diagnostics, not a recording of the full user's inputs or proof of each source's locality. Raw logs remain outside Git.

- `lib/sites/research.ts` generated four fields, ran evidence checks/extraction/recovery, then `releaseResearch` stripped all prose under the shipped source-only policy. Work to fill discarded summaries did not improve what a user could see.
- `lib/sites/verdict.ts:13` on the deployed base required cited text and three-field quality for `Scout`. The release always removed that text. Every card necessarily became `Maybe`, including rank1.
- `app/AreaResearch.tsx:64` repeated “Local evidence unavailable; summary withheld” four times, even when source links had been retrieved.
- `app/ExploreDesk.tsx` led with percentile contrast and serialized full assessment in notes. A valid score was easy to mistake for commercial suitability; repeated warnings obscured the next action.
- `app/brief-pdf.ts` truncated blocks and conditionally omitted source/checklist sections to hold one page.
- The live map lacked an explicit legend and showed the full grid by default. Existing PR13 addresses this; its exact head a748ec41d95947956101d64455f21b3177dedd10 is incorporated with author attribution (local cherry-pick06e1c8d). PR13's remote branch is untouched.

## Fixes

1. Separate `Visit first` / `Joint first` / `Also consider` from web-research status. Rank and ties remain deterministic; web links never promote suitability or alter ranking.
2. Align the active research operation with the shipped **source-discovery** contract: same Gemini2.5Flash +GoogleSearch, bounded40s; retry only missing provider grounding. Do not generate/extract/retry summaries that cannot be displayed. Keep grounding-metadata links only, HTTPS/credential checks, deduplication, locked coordinates and safe structured telemetry. Do not trust model-written URLs. Source discovery is not verified local research.
3. Replace four empty summary cards with nearby Qloo business names/addresses, an exact-map link, honest source status, retrieval time and practical visit checks. Missing/mismatched reports remain unavailable, not success.
4. Share `visitPlan` across screen/notes/PDF. Export priorities, names/coordinates, map links, nearby dining, sources and visit questions. Saved notes retain original letters and full-shortlist ranks. Print across pages instead of truncating; include page numbers and writable notes.
5. Incorporate PR13's background-dot toggle/default-off/legend. Use A/B/C map labels at every width to avoid clipped names after resizing; full names remain in cards/selected-point panel and accessible labels. Verify pointer/card and keyboard marker selection.
6. Keep raw metrics/method details inspectable, not the main recommendation. Show unavailable optional mapped counts in their detail disclosure; never imply zero businesses.

## Evidence and limitations

- Reproduced baseline all-Maybe and equal-score failures with the new visit-plan tests, then fixed them.
- 168tests/29suites pass; lint and Production build pass. No dependency changes.
- Production baseline screenshot/replayed dated real run at1440/390: no page errors/overflow or tested axe violations.
- Changed local production-build replay: pointer/card selection, keyboard marker selection, background-toggle, PDF and notes downloads, no overflow, no tested axe violations at1440/390. Initial eager map-marker binding failed the keyboard contract; corrected add-event plus immediate binding handles Leaflet readiness.
- PDF replay:3pages,19links, extracted text includes all areas, full checklist, method, limitations; exact-map links present. This is artifact/rendering proof with historical data, not a fresh provider run.
- Raw artifacts: `/tmp/sitebrief-urgent-baseline/`, `/tmp/sitebrief-urgent-local/`, `/tmp/sitebrief-urgent-runtime-20261025.jsonl`. Reproducer: `scripts/verify-urgent-clarity.mjs <URL> [historical-run.json]`; omit fixture for actual browser provider retrieval. Configure optional module paths through environment.
- Hosted application head `b1be6d197624ee61ced56965ccc7789490a8d8c3`: immutable Preview `https://sitebrief-ak60wy7u3-circuitstudioais-projects.vercel.app`, deployment `dpl_HZtD3oUfhbc7RvEwZMhiiRuwEg5A`, Vercel checks SUCCESS. One fresh custom API scout passes identity/withholding/rank/source checks (22links, no cache/saved). One fresh actual browser Blue Bottle run passes all UI/export/desktop/mobile checks (32links, no cache/saved). Not a five-run geographic acceptance batch.
- Exact Preview telemetry for both fresh runs: attempt1, source-discovery/sources-only, 6.895s and7.114s, zero retained citations, localityVerified=false. No wasted field-filling retry. Raw receipt `/tmp/sitebrief-urgent-preview-logs.jsonl`.
- Live browser PDF:3pages, complete checklist/method/limits, current provider businesses and sources. Source-only acceptance is not confirmation that all32web links are local.
- Final UI-only follow-up groups long source lists behind a five-link disclosure. Application research/ranking unchanged; final-head hosted rendering checks recorded in PR14. No fresh geographic claim inferred from earlier live calls.

## Not fixed or claimed

Verified source proximity, factual local summaries, completeness across cities, actual foot traffic, vacant units, rents, permissions and restaurant viability remain unproven. PR11 retains the geographic-verification work. This urgent change improves source discovery and visit planning; it does not relabel unverified links as verified findings. Model/provider errors and missing grounding still fail visibly; quota gates, ranking constraints and saved-run provenance remain unchanged. No Production release is claimed.
