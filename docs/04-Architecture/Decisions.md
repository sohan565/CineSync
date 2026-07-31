# Architecture Decision Records (ADR)

## Purpose

Document key architectural decisions, design tradeoffs, and technical revisions for CineSync v1.0 Pro.

---

## Overview

This document records the architectural evaluation and revised engineering decisions across WebRTC topology, real-time event routing, state management, security, and performance.

---

## ADR 001: Hybrid Mesh + Active Speaker WebRTC Topology

- **Status:** Approved
- **Context:** Full P2P WebRTC mesh for $>4$ video feeds causes severe upload bandwidth saturation ($N \times (N-1)$ streams) and CPU overheating on mobile devices.
- **Decision:** Implement **Hybrid WebRTC Mesh Topology**:
  - Full P2P Mesh for rooms with $N \le 4$ video participants.
  - Automatic degradation to 4 Active Speaker video feeds ($240p$) + audio-only for remaining tiles when $N > 4$.
- **Consequences:** Reduces client CPU and upload bandwidth consumption by over 60%.

---

## ADR 002: Dual-Track Realtime Event Routing

- **Status:** Approved
- **Context:** Writing high-frequency events (`PLAYER_ACTION`, `SYNC_CHECK`, `EMOJI_REACTION`) to PostgreSQL introduces database I/O latency ($100-300\text{ms}$).
- **Decision:** Split real-time traffic into two pathways:
  - **Track A (Ephemeral Sync Channel):** In-memory Supabase Realtime Broadcast / WebSocket pub/sub for playback sync, pings, and emoji cascades (sub-30ms latency, zero database writes).
  - **Track B (Persistent Database Pipeline):** PostgreSQL RLS tables exclusively for permanent records (`chat_messages`, `rooms`, `profiles`).
- **Consequences:** Eliminates database I/O bottlenecks and delivers instant playback control updates.

---

## ADR 003: Slice-Based Reactive State Management

- **Status:** Approved
- **Context:** Monolithic store subscriptions notify all components when any state key changes, causing redundant DOM evaluations.
- **Decision:** Modularize state into fine-grained slices (`AuthSlice`, `RoomSlice`, `PlayerSyncSlice`, `ChatSlice`, `WebRTCSlice`, `UISlice`) with key-specific subscriber callbacks.
- **Consequences:** Ensures components only re-render when their explicit dependent slice updates.

---

## ADR 004: Defense-in-Depth Security Strategy

- **Status:** Approved
- **Context:** Client-only text escaping is vulnerable to direct WebSocket API payload injection.
- **Decision:** Implement a 4-layer security strategy:
  1. Strict textContent / DOMPurify rendering.
  2. Strict Content Security Policy (CSP) headers restricting inline script execution.
  3. Supabase RLS policies validating room membership before message insertion.
  4. Token Bucket rate limiting per user (max 5 chat msgs / 3s).
- **Consequences:** Prevents XSS attacks and socket injection abuse.

---

## ADR 005: Type Safety via JSDoc and Declaration Files

- **Status:** Approved
- **Context:** Building in Vanilla JS without compile-step TypeScript risks subtle runtime errors during payload refactoring.
- **Decision:** Provide a central `types/index.d.ts` declaration file and use JSDoc annotations across JS modules for IDE type checking and autocompletion.
- **Consequences:** Complete type safety and developer autocompletion without build pipeline complexity.

---

## Edge Cases

- **Battery Throttling:** When Page Visibility API reports `document.hidden` or battery level $<20\%$, CSS animation frame rates drop to 30 FPS and offscreen WebRTC video decoders pause.

---

## Acceptance Criteria

- [x] All 5 core ADRs documented with Context, Decision, and Consequences.
- [x] Hybrid WebRTC and Dual-Track Realtime models fully specified.

---

## References

- [Technical Architecture](file:///c:/Users/sohan/OneDrive/Desktop/watch%20party/docs/04-Architecture/Technical-Architecture.md)
- [WebRTC Architecture](file:///c:/Users/sohan/OneDrive/Desktop/watch%20party/docs/04-Architecture/WebRTC.md)
- [Realtime Architecture](file:///c:/Users/sohan/OneDrive/Desktop/watch%20party/docs/04-Architecture/Realtime-Architecture.md)
