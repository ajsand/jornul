# Testing Guide

Automated testing validates core local-first behavior, storage integrity, AETS tagging, and swipe preference logic.

## Run Commands

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run verify
```

## Test Layout

- `__tests__/integration/`
  - repository/storage behavior
  - swipe preference computation
  - AETS pipeline integration
  - store state transitions
- `__tests__/lib/services/`
  - AETS keyphrase/tagger/word-list behavior
  - swipe ranking behavior
- `__tests__/lib/utils/`
  - media/file helper behavior

## Priority Coverage Areas

1. **Storage + migrations**
   - schema changes and CRUD contracts
2. **Ingest + AETS**
   - deterministic stage behavior and tag quality constraints
3. **Swipe ranking**
   - predictable ranking with known signals
4. **Sync/consent boundaries**
   - signature and compare-prep state transitions

## Test Expectations for New Work

When touching architecture-critical areas (ingest, storage, sync/consent, AI gateway contracts):

- add/adjust tests in the nearest existing suite
- prefer deterministic fixtures
- avoid hidden network dependencies

## Manual Validation Companion

Use `docs/QA.md` for manual/regression checks that complement automated tests.
