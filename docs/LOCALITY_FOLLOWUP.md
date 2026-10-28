## Follow-up to the bounded PR10 submission release

PR10 ships Qloo ranking and web-source inspection with generated local summaries withheld. This follow-up does not block the submission demo and must remain draft until its own acceptance gates pass.

### Included foundation
Restore the narrow, unused official Toronto facility-location adapter and six regression tests from `0c87211`. Exact allowlisted source/ID/name/address binding, coordinate validation, one request, 8 KiB streamed-body limit, three-second deadline, no redirects/retries, caller cancellation. Not connected to research; not a general locality solution.

### Required before enabling local summaries
- Independently bind source redirects and every subject of each compound claim to observed location evidence.
- Define product radius and location-uncertainty behavior; do not treat the prior 1 km audit experiment as an approved universal product rule.
- Share retrieval/cancellation/deadline budgets across the whole request, not per subject without a bound.
- Define unsupported/non-Toronto behavior and reject unverifiable findings honestly.
- Integrate retention/recovery within existing model/call/quota budgets; no paid upgrades or fabricated coordinates/counts.
- Preserve locked visit identity, deterministic ranking/ties, popularity floors and source truth across fresh/live, MCP/SSE, cache/saved, UI/PDF/notes.
- Pass fresh source/content/locality acceptance. Source-only withholding acceptance on PR10 is not geographic acceptance here.

### Gate
Keep `releaseResearch` withholding active until this work passes independent source review and runtime/Preview validation. Do not enable summaries merely because the helper or mocked tests pass.

Historical negative evidence: official Toronto facility-specific points place two previously cited centres 3.4174 km and 2.6572 km from the locked point. Other claims remain unreviewed; do not describe all of them as false or accepted. See `docs/research-locality/`.
