# Iteration 14 — Self-Insights (Weekly/Monthly) with Local Baseline + Optional Cloud Deep Mode

## Why this iteration exists
Deliver recurring, privacy-preserving self-insight generation that works fully offline by default, while allowing explicit opt-in to deeper cloud analysis through the JournalLink gateway.

## Architecture alignment (must honor)
- Local-first default: baseline insights must generate without any network dependency.
- Deterministic baseline: identical input windows produce identical insight output ordering/content.
- Cloud is optional and additive: deep-insight mode only runs when user explicitly opts in.
- Data minimization: cloud requests send only compact aggregates and ID references, never raw content bodies.

## Scope
### 1) Local baseline insight generation (deterministic heuristics)
Implement a local `SelfInsightsService` that computes weekly and monthly windows using stable, deterministic heuristics over:

- **Tag trend deltas**
  - Compare current window tag counts vs prior equivalent window.
  - Compute absolute delta, relative delta, and momentum category (up/down/flat).
  - Emit insights only when thresholds are met (e.g., min count + min delta) to avoid noise.

- **Save frequency shifts**
  - Track saves per day and per active day for current/prior windows.
  - Identify sustained increases/decreases and bursty behavior.
  - Include streak and gap indicators when statistically meaningful.

- **Media-type/topic movement**
  - Compare movement across media types (article/video/podcast/note/etc.) and top topics.
  - Detect diversification/concentration shifts.
  - Surface meaningful transitions (e.g., text-heavy to video-heavy).

Determinism requirements:
- Fixed time window boundaries (device-local timezone, normalized at generation time).
- Stable sorting by score, then type, then deterministic ID.
- No randomness or non-deterministic tie-breaking.

### 2) Optional cloud deep-insight mode via gateway (minimized payload)
Add an optional deep-insight pipeline invoked only when cloud mode is enabled:

- **Opt-in gate**
  - Cloud deep mode is disabled by default.
  - User must explicitly enable in Settings/Insights.
  - Show concise notice describing what aggregate data is sent.

- **Payload minimization contract**
  - Send only aggregate metrics + ID references required for reasoning:
    - time window metadata
    - top-N tags/topics with counts/deltas
    - media-type distribution changes
    - save-frequency summary stats
    - candidate evidence item IDs
  - Exclude raw note text, URLs, titles, and extracted content.

- **Gateway integration behavior**
  - Local baseline cards render first.
  - Deep cards append/merge when gateway response succeeds and passes schema validation.
  - On timeout/failure/offline: keep baseline output and show non-blocking deep-mode unavailable state.

### 3) Insight card output schema + evidence pointers (item IDs only)
Define/extend a typed schema for persisted/rendered insight cards:

```ts
InsightCard {
  id: string;                    // deterministic local ID or gateway ID
  period: 'weekly' | 'monthly';
  windowStart: string;           // ISO
  windowEnd: string;             // ISO
  source: 'local-baseline' | 'cloud-deep';
  type: 'tag-trend' | 'save-shift' | 'media-movement' | 'topic-movement' | 'meta';
  title: string;
  summary: string;
  confidence: number;            // 0..1
  score: number;                 // ranking score for stable ordering
  metrics: Record<string, number | string | boolean>;
  evidence: {
    itemIds: string[];           // IDs only
    supportingStats: Record<string, number | string>;
  };
  createdAt: string;             // ISO
  generationVersion: string;
}
```

Schema rules:
- Evidence pointers must use `itemIds` only (no body snippets).
- Card must include generation provenance (`source`, `generationVersion`).
- Invalid cloud cards are rejected and never persisted.

### 4) UI placement + history persistence
Add discoverable insight surfaces and retained history:

- **Placement options (choose one implementation path)**
  - Add `Insights` tab under Vault area for primary browsing, **or**
  - Add `Settings → Insights` section with entry into insight timeline.

- **History persistence**
  - Persist each generation run (weekly/monthly) with timestamp and config snapshot (local-only vs cloud-enabled).
  - Retain historical cards for trend-over-time review.
  - Provide lightweight filtering by period (weekly/monthly) and source (baseline/deep).

- **UX states**
  - Empty state for insufficient data.
  - Offline badge/state for deep mode when not reachable.
  - Clear labels distinguishing local baseline vs cloud deep insights.

### 5) Privacy, consent, and controls
- Add explicit control copy clarifying default local-only operation.
- Require explicit user action to enable cloud deep mode.
- Provide one-tap disable and immediate reversion to local-only generation.
- Log consent state changes for local auditability.

## Acceptance criteria
1. **Offline baseline reliability**
   - With network disabled, weekly/monthly baseline insights generate and render successfully.
   - Output is deterministic across repeated runs on unchanged data.

2. **Cloud explicit opt-in behavior**
   - No cloud calls occur before opt-in.
   - After opt-in, deep-mode calls use minimized payload and never include raw item content.
   - Disabling opt-in immediately stops cloud calls.

3. **Schema + evidence integrity**
   - All cards conform to typed schema.
   - Evidence pointers contain item IDs only.
   - Invalid gateway payloads are rejected safely with baseline fallback preserved.

4. **History and placement**
   - Insights are accessible via chosen UI placement.
   - Weekly/monthly runs persist and are browsable as history.

5. **User transparency**
   - UI clearly indicates insight source (local vs cloud).
   - Degraded deep mode (offline/failure) does not block baseline insights.

## Verification checklist
- Unit tests for local heuristic computations and deterministic ordering.
- Unit tests for schema validation and payload minimization.
- Integration tests for opt-in/opt-out cloud behavior.
- Offline manual run validating baseline generation and history persistence.
- Manual UX checks for source labeling and degraded deep-mode messaging.
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Iteration-ready implementation plan and schema contract for weekly/monthly self-insights with privacy-safe local baseline and explicit opt-in cloud deep mode.
