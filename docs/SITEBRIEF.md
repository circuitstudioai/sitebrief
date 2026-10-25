# Sitebrief — product scope

Sitebrief helps restaurant operators, small chains and real-estate advisers decide which areas to scout. It creates a visit shortlist, not a recommendation to sign a lease.

## Primary journey

1. Choose a city and search radius.
2. Describe the restaurant and its audience references. Exact brands resolve before same-name outlets; genuine ambiguity remains explicit.
3. Optionally add existing outlets and an exclusion distance.
4. Choose balanced discovery or established popularity. Both enforce a minimum local Qloo popularity floor.
5. Build a scouting brief: real Qloo map evidence, audience profile, nearby-venue comparison and web-source links to inspect.
6. Inspect actual rank/ties, save areas and download a visit-plan PDF or full notes.

The lead example is a proposed Blue Bottle expansion into Toronto. A new café with an indoor playground using popular Toronto cafés remains a secondary example. Prices, hours and existing outlets are not invented. Reference cafés are selected from Qloo's returned local sample, not an exhaustive city leaderboard or proof of parental demand.

## Secondary journey

`/compare` compares known addresses using operator rents/budget and Qloo evidence. Its fixed sample is clearly labelled. Users may search locations, use the map deliberately or enter coordinates.

## Input effects

Audience entities drive Qloo taste signals. Radius, minimum popularity and supplied outlet buffers change eligibility. Restaurant format, prices/hours when supplied and the concept inform research and visit questions, not fabricated taste scores.

## Boundaries

No measured footfall, available units, rent verification, zoning approval, customer demand or success probabilities are inferred. No accounts, billing, outreach or customer validation are claimed. Shared Upstash Redis admission is active at 50 live jobs per UTC day per environment; details are in SETUP.md. Visit first / Joint first / Also consider describe visit order from Qloo ranking, not commercial viability. Web-research status is separate. Skip cards show actual failed rules. OSM mapped category counts are descriptive context, not an exhaustive competitor census or unmet demand.

Methods: [SCOUT_AGENT.md](SCOUT_AGENT.md). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md). Recording: [restaurant-demo-plan.md](restaurant-demo-plan.md).

## October 24 bounded submission release

The shipped research experience is source discovery, not verified local summaries. All four generated local summary fields are withheld until source-bound proximity validation is implemented. This includes saved/cache, UI and downloads. Source links are explicitly unvalidated inspection material. Qloo audience mapping, deterministic ranking and operator constraints remain usable; no claim of geographic research acceptance is made. See [release readiness](release-readiness.md).
