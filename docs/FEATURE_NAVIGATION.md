# Feature navigation and map modes

Owner authorization: PM7178, 2026-10-25. Merge PR14 first; implement the recommended top navigation and two visible map modes in a **separate PR**. This branch starts from verified merged main `558b98a1a42e87f96ef3d49bd2311cd7c0d08b7a`, not the old PR14 head.

## Landed prerequisite

PR14 merged through guarded async squash request `bb68cdb2-d9fb-4673-853f-91efb369a92e`, expected head `d19949b5b0cc69ee892d42d1c1c2d356d6521680`, no bypass. GitHub MERGED/merge SHA verified. Production `dpl_6yK43nUB22UVRrAkXsoFF9uPr6RB` READY for the merged main; canonical and compatibility aliases remain attached. Fresh canonical Production Blue Bottle browser run passes, not cached/saved: map/card/keyboard selection, source-only boundaries, PDF/notes, desktop/mobile overflow and tested axe checks. Receipt `/tmp/sitebrief-pr14-production/summary.json` (raw run/artifacts outside Git). No geographic-summary acceptance inferred.

## This PR

- Shared semantic navigation on both `/` and `/compare`: **Find areas** / **Compare locations**, with `aria-current=page`, active appearance, keyboard operation and mobile-visible placement.
- Above populated discovery maps, two visible choices: **Shortlist only** / **Shortlist + scoring points**. They are a button group, exactly one pressed. Shortlist is the default; repeated selection of the same mode does not flip it.
- Explain that pins match shortlisted areas and scoring dots are background scores—not businesses or available properties. For an empty shortlist, explain that scoring points can still be inspected.
- Keep the existing display cap: show at most 4,000 scoring dots, and state the shown count versus returned count. Preserve the saved-grid limitation. Do not call it a complete city or business dataset.
- Mode switches only change rendering. They make no new scouting requests and do not change ranks, selected inputs, eligibility, source links or provider results. No new layers/provider/geocoding infrastructure.

## Validation

169 tests / 29 suites, lint and Production build pass. `scripts/verify-feature-navigation.mjs <URL> <recorded-run.json>` replays scouting (no paid provider calls), operates both modes with pointer/keyboard, verifies default-off, repeated-choice stability and existing 4,000-point cap. It navigates both directions with real links, verifies active-page semantics and runs the real free sample comparison through `/api/sites` with an explicit guard that rejects any non-sample request. Rendering/a11y/screenshot checks at 1440, 1024, 768 and 390 pixels. Local/hosted receipts appended in the PR; screenshots/raw records stay outside Git.

Updated `scripts/verify-urgent-clarity.mjs` to operate the two modes while retaining previous map/export assertions. Older historical acceptance scripts/receipts are not relabelled as exact-head proof.

Production contains PR14 only. This navigation/map-mode PR stays unmerged for review. MeterKit remains paused; no Devpost filing or new verified local research is claimed. Copy-audit items 5–6 remain outside this scope.

Local browser receipt: `/tmp/sitebrief-feature-navigation/summary.json`: both workflows pass at all four viewport widths, zero tested axe violations, no page errors, one sample comparison request and no additional scouting requests from map controls. Export/map regression replay also passes at desktop/mobile (`/tmp/sitebrief-navigation-exports/summary.json`). Scout rendering uses a recorded run; it is not new provider acceptance. The comparison uses the real free sample API.
