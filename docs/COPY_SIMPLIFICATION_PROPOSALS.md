# App-wide plain-language review — implementation and pending scope

Request: Abhi, PM7166,2026-10-25. PM7166 approved the popularity control and mapped-business activity copy. PM7170 subsequently approved items1–4 from the Telegram summary. Those four are implemented below. Items5–6 and the separate compare/data-point discovery proposals are still discussion-only. No merge/Production change is implied.

## Implemented in PR14

- Popularity control: “Which areas should we include?” with “Explore more areas” (20) and “Focus on established areas” (50). Explain the difference in plain language; put exact percentiles under “How this works.” State Qloo popularity is neither measured foot traffic nor proof of demand. Clarify that popularity does not establish business age. Values, eligibility, sorting and other rules stay unchanged.
- Mapped-business activity: “Checking mapped businesses within 1 km. Some businesses may be missing. This count does not affect visit order.” Shared copy applies to fresh, cached and saved steps, preserving real status, original timestamps and counts. Technical source attribution stays available.

## PM7170 implemented items1–4

- Audience patterns replace “Audience DNA”; age scores remain available in expandable details with the explicit reference-audience versus local-resident distinction.
- Excluded points and empty states use plain reasons, preserving the difference between missing data and actual rule failures. Exact scores/thresholds remain in details; unchanged20/50popularity and70thaudience rules.
- Near-tie text says “These areas score very similarly.” The original numeric condition is unchanged; exact-score explanation remains inspectable. No general map-tooltip or data-point-toggle redesign is included.
- Fresh and recorded progress use readable titles and Property / Getting there / Nearby businesses / Local places. Tool IDs, enum values sent to research, failure/status/identity/duration and locality withholding are unchanged. Legacy priority labels translate through an allowlisted parser; arbitrary old model prose is not carried into the new notice.

## Audit record (first four addressed as scoped above; later rows pending)

| Priority | Surface / current wording | Proposed user-facing wording or structure | Meaning that must remain |
| --- | --- | --- | --- |
| High | `app/AudiencePanel.tsx`: “AUDIENCE DNA”, “Age affinity signals”, “Signed reference-audience affinity” | “Audience patterns”; “Age groups associated with your reference brands.” Put signed raw scores and technical explanation under “How to read these signals.” | These describe the chosen reference audiences, NOT the people living near a map point. They are not population percentages. Missing age data stays explicit. |
| High | `app/ExploreDesk.tsx`, `app/VerdictCards.tsx`: “popularity screen”, “floor”, “top-30% affinity screen” | “Areas outside your settings”; explain the actual rule for each excluded point in plain language. For missing coverage: “Not enough popularity data to compare these areas. Try another city or audience.” | Differentiate missing data from failing a rule. Preserve counts, original thresholds and all-excluded outcomes; no automatic relaxation. |
| High | `app/ExploreDesk.tsx`, `app/SiteMap.tsx`: “rank contrast”, “percentile points”, “near-ties” | “How the map points are scored” disclosure. Primary near-tie message: “These areas score very similarly. Compare properties, access and costs in person.” | A score compares returned map evidence; it is not demand, foot traffic or success probability. Exact metrics remain inspectable, ties unchanged. |
| High | `lib/sites/scout-agent.ts` / rendered activity: “Mapping audience fit against popularity”, “Research priorities: SPACE → ACCESS…” | Short activity steps such as “Finding areas for your audience” and “Looking for web sources.” Translate research priorities into “Property”, “Getting there”, “Nearby businesses”, “Local places.” | Translate only the display layer. Keep tool schemas/IDs, actual incomplete/error states, request limits and technical traces intact. Never suggest verified practical findings from a source lookup. |
| Medium | `app/AudiencePanel.tsx`: “Different tag taxonomies… unmet commercial need” | “These sources may describe businesses differently. Missing shared tags do not mean there is a business opportunity.” | A lack of common tags is not evidence of a market gap. No missing-result inference. |
| Medium | `app/ExploreDesk.tsx`, `app/StoreCounts.tsx`, `app/SiteDesk.tsx`: repeated “reused Qloo evidence”, “census”, “Inspect category query”, provider-centric score labels | Consistent states: “New search”, “Previous real search — [date]”, “Example data — made up.” Count details: “About this count” / “View the map data.” Compare score: “Audience match score” with Qloo as the source. | A saved real run is not made-up sample data. New retrieval is not proof of freshness of every source. Count unavailable is never zero. Scores compare this run, not probabilities or sales forecasts. |

## Scope and evidence

Reviewed active exploration controls/results/research, audience panels, map labels/tooltips, activity messages, mapped-count details, visit-plan PDF/notes and the comparison form/results/method. The compare workflow already has several clear disclosures (sample rent, rent missing, budget check); keep those rather than rewriting everything.

The prior PR14 browser evidence covers populated explore at1440/390, exact point/card/keyboard selection, current sourced links and PDF/notes. These proposals come from active source and rendered exploration review; they are not a claim of new live-provider acceptance for every comparison state. Provider/API/tool contracts and historical receipts are not candidates for indiscriminate word replacement.

Validation:169tests/29suites, lint/build/diff checks pass. `scripts/verify-plain-language.mjs` exercises a historical run with explicitly synthetic signed-age, near-tie, excluded-point and three empty-state branches. Desktop1440/mobile390 preserve signed values, unavailable status and metadata, reject stale-prose leakage, and pass overflow/axe checks. This is rendering/contract proof, not new provider or demographic acceptance. Raw artifacts `/tmp/sitebrief-plain-language/` remain outside Git.

## Separate PM7172 discussion — NOT implemented

- Make “Find areas to scout” and “Compare addresses” visible feature choices near the top; explain that comparison is for two or three known locations.
- Clarify the background data-point toggle with a plain explanation that dots are scoring evidence, not businesses or properties. Keep its default off and disclose display sampling if more than4000cells exist.

These remain proposals pending the owner's decision. Items5–6 from the Telegram audit (data-state labels and detailed count/comparison copy) also remain unchanged. Preserve progressive technical detail and all evidence boundaries; do not change ranking, provider calls, eligibility or local-verification policy in a copy pass.
