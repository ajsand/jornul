# Definition of Done

## Per-Iteration DoD
Each iteration is considered "done" when:
1. Code changes are complete and follow existing patterns
2. TypeScript compiles without errors (`npm run typecheck`)
3. Linter passes without errors (`npm run lint`)
4. Manual QA checklist passed (see `QA.md`)
5. Documentation updated (ARCHITECTURE.md, ROADMAP.md if needed)
6. Changes committed with descriptive message

## MVP "Feature Complete"
- User can Quick Add (paste link/text) → item appears in Library
- User can import files → items appear in Library
- Items auto-tag locally and tags can be edited
- Library can filter by tag/type/date and search
- Swipe Builder records like/dislike and updates profile signature
- Compare Session works locally with consent gates and renders Insight Card (mock)

## "Production-Ready" (Iteration 20)
- No crashes in core flows (crash reporting enabled)
- All sensitive data not logged (verified in QA)
- Cloud AI is opt-in with minimization/redaction and clear disclosures
- EAS production builds succeed iOS + Android
- Full QA regression checklist passes
- Performance benchmarks met (library loads <500ms for 1000 items)
- Accessibility audit complete (screen reader support, keyboard navigation)
