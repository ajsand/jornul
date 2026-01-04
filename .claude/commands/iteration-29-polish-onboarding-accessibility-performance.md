# Iteration 29 — Product Polish: Onboarding, Empty States, A11y, Performance
**Primary subagents:** journallink-mobile-ui  
**Support subagents:** journallink-qa, journallink-architect

## Goal
Make the app feel shippable:
- onboarding explaining local-first + swipe + sync
- empty states everywhere
- accessibility and performance improvements

## Implementation Requirements
- Onboarding flow:
  - privacy-first explanation
  - choose Quick Start (Swipe) vs Deep Start (Scratch)
- Empty states:
  - Vault empty
  - Swipe catalog loading
  - Insights empty
- A11y:
  - labels on buttons
  - min hit targets
- Performance:
  - list virtualization
  - memoization for tag chips

## Acceptance Criteria
- Fresh install experience is smooth.
- No “dead screens”.
- Basic a11y checks pass.

## Commit
`chore(ui): onboarding + empty states + a11y + perf polish`
