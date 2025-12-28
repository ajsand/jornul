# Definition of Done

This document defines when an iteration is considered complete and ready for the next phase.

## Per-Iteration DoD Checklist

Each iteration is considered "done" when ALL of the following are true:

### 1. Code Quality
- [ ] All new code follows existing patterns in the codebase
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes without errors (`npm run lint`) - warnings acceptable
- [ ] No new `any` types without justification comment
- [ ] No `console.log` of sensitive content (see Privacy doc)

### 2. Functionality
- [ ] All acceptance criteria from ROADMAP.md are met
- [ ] Feature works on at least one platform (iOS, Android, or Web)
- [ ] No regressions in existing features
- [ ] Edge cases handled gracefully (empty states, errors)

### 3. Testing
- [ ] Manual QA checklist passed (see QA.md)
- [ ] Database operations tested (if applicable)
- [ ] Happy path verified
- [ ] Error path verified (what happens when things fail)

### 4. Documentation
- [ ] Code is self-documenting (clear naming, small functions)
- [ ] Complex logic has inline comments
- [ ] ARCHITECTURE.md updated if structure changed
- [ ] ROADMAP.md updated (current iteration marked complete)
- [ ] README updated if new setup steps needed

### 5. Version Control
- [ ] Changes committed with descriptive message
- [ ] Commit message follows pattern: `iter-XX: description`
- [ ] No unrelated changes in commit

---

## Feature-Specific DoD

### For UI Features
- [ ] Dark mode renders correctly
- [ ] Touch targets at least 44x44 points
- [ ] Loading states shown during async operations
- [ ] Error states shown when operations fail
- [ ] Keyboard dismisses appropriately

### For Database Features
- [ ] Migration added (version incremented)
- [ ] Repository function added
- [ ] Types updated in types.ts
- [ ] Integration test in test-db.ts
- [ ] Index added for frequent queries

### For Sync Features
- [ ] Works with BLE disabled (QR fallback)
- [ ] Consent gate implemented
- [ ] Privacy compliance verified
- [ ] Error handling for connection failures

### For AI Features
- [ ] Works with AI disabled (local fallback)
- [ ] API key stored in SecureStore
- [ ] Privacy disclosure shown to user
- [ ] Rate limiting implemented
- [ ] Error handling for API failures

---

## MVP "Feature Complete" Criteria

The MVP is feature-complete when ALL of the following work end-to-end:

### Capture
- [ ] Quick Add: Paste URL → item in Library
- [ ] Quick Add: Paste text → item in Library
- [ ] Mass Import: Select files → items in Library
- [ ] Auto-tagging: Items receive suggested tags

### Browse
- [ ] Library: Shows all items
- [ ] Library: Filter by type
- [ ] Library: Filter by date
- [ ] Library: Filter by tag
- [ ] Library: Search by text
- [ ] Detail: View item
- [ ] Detail: Edit tags
- [ ] Detail: Add notes

### Profile
- [ ] Swipe Deck: Shows cards
- [ ] Swipe Deck: Like/dislike signals saved
- [ ] Profile: Signature built from signals

### Sync
- [ ] Pairing: QR code works
- [ ] Consent: User selects what to share
- [ ] Compare: Capsule exchanged
- [ ] Insight: Card rendered (local mock OK)

---

## "Production-Ready" Criteria (Iteration 26)

Beyond feature-complete, production requires:

### Stability
- [ ] No crashes in core flows (verified via testing)
- [ ] Crash reporting enabled (Sentry or equivalent)
- [ ] Memory profiling complete, no leaks
- [ ] Bundle size under target (TBD)

### Performance
- [ ] Library loads < 500ms for 1000 items
- [ ] Item detail opens < 100ms
- [ ] Ingest processing < 2s per item
- [ ] Search results < 200ms

### Privacy
- [ ] All sensitive data not logged (verified in QA)
- [ ] Cloud AI is opt-in only
- [ ] Capsule minimization verified
- [ ] PII redaction verified
- [ ] API keys in SecureStore only

### Build & Deploy
- [ ] EAS production builds succeed (iOS + Android)
- [ ] OTA updates configured
- [ ] App icons at all required sizes
- [ ] Splash screen configured
- [ ] Version number incremented

### Compliance
- [ ] Privacy policy URL live
- [ ] Terms of service URL live
- [ ] App Store/Play Store metadata complete
- [ ] Age rating determined
- [ ] Data safety form complete (Play Store)

### Accessibility
- [ ] Screen reader support verified
- [ ] Dynamic text sizes respected
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets meet minimums

---

## Iteration Sign-Off

After completing an iteration, update this section:

| Iteration | Date | Status | Notes |
|-----------|------|--------|-------|
| 01 | - | Complete | Data layer foundation |
| 02 | - | Complete | Quick Add |
| 03 | - | Complete | Library |
| 04 | - | Complete | Item Detail |
| 05 | - | Complete | Mass Import |
| 06 | - | Complete | File storage |
| 07 | Dec 2025 | Complete | Baseline verification + docs |
| 08 | - | Pending | SQLite schema v1 |
| ... | | | |
