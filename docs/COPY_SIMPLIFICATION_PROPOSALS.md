# App-wide plain-language review — owner decision pending

Request: Abhi, PM7166,2026-10-25. **Only the two explicitly approved changes are implemented.** The proposals below are an audit, not authorization to change additional app wording or behavior. No merge/Production change is implied.

## Implemented in PR14

- Popularity control: “Which areas should we include?” with “Explore more areas” (20) and “Focus on established areas” (50). Explain the difference in plain language; put exact percentiles under “How this works.” State Qloo popularity is neither measured foot traffic nor proof of demand. Clarify that popularity does not establish business age. Values, eligibility, sorting and other rules stay unchanged.
- Mapped-business activity: “Checking mapped businesses within 1 km. Some businesses may be missing. This count does not affect visit order.” Shared copy applies to fresh, cached and saved steps, preserving real status, original timestamps and counts. Technical source attribution stays available.

## Proposed, NOT applied

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

Recommendation: discuss the first four items as the next focused wording pass. Preserve progressive technical detail and every evidence boundary. Do not change ranking, provider calls, eligibility, demographics interpretation or local-verification policy as part of a copy-only pass.
