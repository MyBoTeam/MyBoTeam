# Problem: Task Orchestration

**Feature Area**: Task Orchestration
**PDRs Referenced**: PDR-001, PDR-002, PDR-006
**Generated**: 2026-06-10
**Dependencies**: Overview
**Section Number**: 3 (in final PRD)

---

## 3. The Problem

**Purpose**: Articulate why the product needs a task-first orchestration model instead of a chat-only interaction loop.

### 3.1 Problem Statement

Simple users want to ask for useful work, leave, and come back to an outcome. A chat-only surface does not provide enough structure for resumability, scheduling, permissions, accountability, or confirmation that the agent actually finished something valuable.

### 3.2 Problem Context

**Current State:**

- The product already exposes execution pages, follow-ups, todos, favorites, and scheduled task storage.
- Automation can touch files, connectors, and browser flows, which creates state and trust obligations beyond normal chat.

**Pain Points:**

- Users lose continuity when work is spread across messages without a durable task record.
- Users need clearer checkpoints when an agent is waiting on permission or has completed a result.
- Broad simple-user positioning breaks down if the system feels like an operator console instead of a guided task experience.

**Impact of Not Solving:**

- Lower task completion and weaker repeat usage because users cannot easily resume or trust work in progress.
- Higher support burden because failures, pauses, and permissions are harder to interpret.
- Reduced differentiation because the product looks like another assistant shell instead of an automation system.

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| Product routes | Existing web app | Execution, conversation, favorites, and examples all revolve around tasks. |
| Storage model | Local database schema | Tasks, messages, todos, attachments, favorites, and scheduled tasks are first-class records. |
| UX behavior | Execution surface and locale strings | Permission waits, queued state, follow-ups, and completion states are already explicit user needs. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-001 | MyBoTeam is a personal AI workforce | The product must manage real work units rather than open-ended conversation only. |
| PDR-002 | Task execution is the primary workflow unit | Establishes continuity, scheduling, and task identity as the core problem framing. |
| PDR-006 | Human control stays in automation loops | Makes visibility and permission handling part of the problem, not an edge case. |
