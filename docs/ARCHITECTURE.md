# Sitebrief architecture

Next.js App Router, TypeScript and React on Vercel. Leaflet displays map points; Photon/OpenStreetMap supplies location lookup and nearby labels. Credentials stay server-side.

## Request flow

Browser → `/api/scout` → bounded Gemini function calls → Qloo exploration/profile/compare → Google Search notes + source discovery → unverified-summary honesty stamp → structured decision codes → deterministic rank facts → SSE events and final brief.

Server code locks the highest-ranked eligible point immediately after exploration, preserving explicit ties. Research execution and the final model schema use only that point. `lib/sites/visit-research.ts` requires matching IDs and exact coordinates; UI/export/cache/saved recovery use the same check. The model chooses research priorities/focus, a nearby-audience comparison target and visit check codes, not a new visit candidate. `lib/sites/decision.ts` renders the actual shortlist rank and tie status.

## Ownership

| Module | Responsibility |
|---|---|
| `lib/sites/qloo.ts` | Authenticated read boundary and verified reference resolution |
| `lib/sites/compare.ts` | Parse original heatmap values and compare known sites |
| `lib/sites/signal.ts` | Positive-popularity coverage, local midrank percentiles and contrast |
| `lib/sites/explore.ts` | Radius, outlet exclusions, popularity/taste screens and separated points |
| `lib/sites/profile.ts` | Audience tags, signed demographic affinity, brands and venue comparison |
| `lib/sites/research.ts` | Source retrieval, bounded retries/deadline and safe diagnostic events |
| `lib/sites/research-release.ts` | Unverified-summary honesty stamp and source-inspection acceptance across live/saved/cache/UI/exports |
| `lib/sites/research-report.ts` | Legacy recorded-report rechecks and safe failure categories; new live research uses structured-research.ts |
| `lib/sites/visit-research.ts` | Final-visit research identity by ID and coordinates across consumers |
| `lib/sites/decision.ts` | Strict decision-code contract and deterministic rank/tie wording |
| `lib/sites/scout-agent.ts` | Allowed stages, bounded model turns, real tool events and final selection |
| `lib/sites/mcp.ts` | Read-only tools exposed through `/api/mcp` |
| `app/ExploreDesk.tsx` | Brief, map/card state, actual tool activity and decision presentation |

## APIs

`/api/explore`, `/api/sites`, `/api/research` and `/api/scout` validate their inputs. `/api/explore/tool`, `/api/sites/tool`, `/api/research` and `/api/scout` publish tool contracts. `/api/mcp` implements stateless Streamable HTTP JSON-RPC. `/api/locations` handles geocoding. Retired partnership endpoints return410 and have no provider work.

## State and limitations

No user accounts or stored briefs are configured. The quota integration uses dedicated Free Vercel Marketplace Upstash Redis; provisioning and Sensitive Preview/Production configuration are complete. Saved areas are tab-local. The example cache and concurrency counters are per warm server instance, not durable storage, per-visitor quotas or global spending limits. The feature branch uses shared atomic Redis admission (server TIME, fixed 50/day per environment, no eviction) for paid public routes and MCP calls. Missing shared storage fails closed; process-local counters are only concurrency hints. Reused real runs show their original timestamps; no simulated progress is presented as live.

The old partnership implementation and its obsolete docs were removed. Git history retains earlier product versions; they are not runtime dependencies or current specifications.
