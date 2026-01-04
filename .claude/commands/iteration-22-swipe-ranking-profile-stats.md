# Iteration 22 — Swipe Ranking + Preference Model → Profile Stats
**Primary subagents:** journallink-swipe, journallink-aets  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Implement the swipe ordering strategy:
- trending early
- diverse exploration mid
- long-tail late
And map swipe signals into emergent tags/themes.

## Implementation Requirements
### A) Ranking algorithm (seedable)
- Score candidates using:
  - popularity_score
  - preference match (learned from prior swipes)
  - novelty/diversity factor
- Ensure exploration: don’t only show “likely likes”

### B) Preference model
- Maintain per-user stats:
  - affinity by tag/theme
  - affinity by media type
- Liked tags reinforce AETS; disliked downweight

### C) Swipe Summary screen
- “You lean toward…” list of top themes
- Show “strong dislikes” as well (optional)

## Acceptance Criteria
- New user sees popular items first.
- After 50 swipes, deck adapts but still explores.
- AETS receives reinforcement signals.

## Verification Checklist
- Cold start session: verify trending distribution
- After 30 likes in “NBA” tags: more NBA appears, but still variety
- AETS tags show reinforcement from swipes

## Commit
`feat(swipe): ranking + preference model + profile summary`
