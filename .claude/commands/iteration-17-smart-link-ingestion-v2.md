# Iteration 17 — Smart Link Ingestion v2 (Multi-link + Rich Metadata)
**Primary subagents:** journallink-ingest, journallink-aets  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Fix link-based captures so titles/tags come from the *actual linked content*, not just the URL string. Support entries containing **multiple links**, producing a combined title + meaningful noun-phrase tags.

## Plan Mode Instructions (do first)
1) Inspect current ingest pipeline + any background job queue.
2) Locate current URL parsing / default titling/tagging logic (the “watch/youtube/url” issue).
3) Propose a metadata strategy that is:
   - Offline-first fallback (fast save)
   - Online enhancement (fetch + update)
4) Identify schema changes (if any) for storing per-link metadata.

## Implementation Requirements
### A) Parse multi-link entries
- Detect 1..N URLs inside a text body.
- Store them as:
  - item.text (original)
  - item.url optional if single-link OR store a normalized `links_json` field / `item_links` table.

### B) Fetch metadata (best effort)
- If network available:
  - Fetch OpenGraph title/description/image when possible.
  - For YouTube specifically, prefer oEmbed/OpenGraph title so the saved title becomes the video title (not “watch”).
- If network unavailable or fetch fails:
  - Use URL hostname + path segment heuristic for temporary title.
  - Mark item as `needs_enrichment = true` for later.

### C) Combined title + tags for multi-link
- Build per-link topic tags (noun phrases).
- Combine:
  - Title: choose a compact theme label (e.g., “Fish Cooking Recipes”) using overlap across links.
  - Tags: include shared themes + specific nouns (e.g., cooking, recipe, salmon, cod, tuna, chef-name if present).
- Tags must avoid meaningless tokens (verbs/adjectives alone) unless proper noun.

### D) UX
- Scratch “Paste & Save” should:
  - Save instantly
  - Show status in Inbox: “Enriching links…”
  - Update title/tags when enrichment completes.

## Acceptance Criteria
- Single YouTube link → saved title matches actual video title when online.
- Multi YouTube links about recipes → combined title/theme tags created; includes specific fish names if present.
- Offline mode: still saves immediately with a fallback title + later enrichment.
- Tags are mostly noun phrases; no junk tokens like “meets”, “evil” unless justified.

## Verification Checklist (QA)
- Add 1 youtube link (online) → verify title/tag update after enrichment.
- Add 3 youtube cooking links (online) → verify combined title + tags.
- Disable network → paste link → verify immediate save + “needs enrichment” behavior.
- Confirm no crashes, no blocking spinner.

## Commit
`feat(ingest): smart link enrichment + multi-link titling/tagging`
