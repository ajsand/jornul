# Iteration 18 — AETS v2: Meaningful Phrase Tags (No Junk Tokens)
**Primary subagents:** journallink-aets  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Upgrade the emergent tagger to produce **meaningful noun/noun-phrase tags**, allow multi-word tags, and reduce irrelevant single tokens. Implement per-user emergent tag creation + merges.

## Plan Mode Instructions
1) Inspect current tag generation (likely split-by-space).
2) Propose a phrase extraction strategy that works offline:
   - stopwords
   - noun phrase heuristics
   - proper noun detection
   - minimal stemming/normalization
3) Identify UI touchpoints where users can:
   - accept/reject suggestions
   - merge/rename tags

## Implementation Requirements
### A) Candidate extraction
- From item.title + item.text + enriched metadata summaries
- Produce candidate phrases:
  - 1–3 word noun phrases
  - proper nouns (“LeBron James”, “Bruno Mars”)
- Filter:
  - stopwords
  - verbs-only tokens
  - adjectives-only tokens
  - “meaningless connector” words

### B) Tag normalization
- Normalize casing/punctuation
- Slug generation
- Deduplicate near-identical tags

### C) Tag assignment
- Score tags and store with `source=auto`, `score`
- Keep manual overrides intact

### D) Minimal Tag Management UI
- In item detail: “Edit tags”
- In tag browser: merge/rename (basic)

## Acceptance Criteria
- Tags can be multi-word phrases.
- Tags no longer become random single words from titles.
- Users can merge tags (“nba” + “NBA”).
- Tag assignments persist and drive Vault filters.

## Verification Checklist
- Create entry with mixed links (music + sports) → tags reflect both, without junk tokens.
- Merge two tags → Vault filter updates correctly.
- Edit tags on an item → persists.

## Commit
`feat(aets): noun-phrase emergent tags + merge/rename ui`
