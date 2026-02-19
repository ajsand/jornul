# JournalLink Architecture (Updated)

## Overview

JournalLink is a local-first Expo app with a deterministic ingest pipeline, emergent tagging, swipe preference signals, QR-based in-person compare sessions, and optional cloud insight generation through a centralized gateway.

## High-level Layers

1. **UI (Expo Router)**
   - Inbox, Scratch, Vault, Swipe, Sync, Settings
2. **State (Zustand)**
   - journal, sync/session, settings
3. **Core Services**
   - ingest pipeline, AETS tagging/themeing, swipe ranking, consent/capsule builder, insight renderer
4. **Storage**
   - SQLite metadata + local file storage
5. **Cloud Boundary (optional per action)**
   - JournalLink Cloud AI Gateway for link enrichment/tagging/compare insights

## Core Data Domains

- Content: `items`, `item_links`, `files`, `extractions`
- Taxonomy: `tags`, `tag_assignments`, `themes`, `theme_members`
- Swipe: `swipe_catalog`, `swipe_sessions`, `swipe_events`
- Sync/compare: `signatures`, `pending_sessions`, `session_ledger`, `compare_sessions`, `insight_cards`

## Ingest Pipeline

Deterministic stages per item:
1. detect (kind/mime/links)
2. normalize (title/source metadata)
3. extract (OCR/ASR/PDF/link fetch as available)
4. tag (AETS noun-phrase oriented)
5. theme refresh (incremental)
6. ready/failed state update

Design requirements:
- immediate save for user action
- background/resumable enrichment
- explicit status surfaced in Inbox

## Sync + Consent

- QR exchange is baseline transport
- signatures are summary-only
- consent gates scope + sensitive defaults + cloud toggle
- compare capsule is minimized and inspectable

## Cloud AI Gateway Integration

App calls first-party gateway endpoints (not raw providers):
- auth/billing status
- link enrichment
- tagging assists
- compare insights

Gateway responsibilities:
- authenticate user/session
- enforce subscription/quota
- redact/reject non-minimized payloads
- route to model providers
- return schema-validated JSON only

## Security & Privacy

- no raw private content in logs
- no plaintext secret storage
- metadata-only ledgering for shared actions
- local-first behavior independent of gateway availability

## Delivery Priorities

1. Stabilize Scratch/Vault/Inbox
2. Finalize ingest + batch jobs + multi-link handling
3. Improve AETS quality + tag management
4. Integrate cloud gateway for enrichment/insights
5. Expand swipe + ranking
6. Harden sync/consent/insight history
7. Native share intake dev-build work
