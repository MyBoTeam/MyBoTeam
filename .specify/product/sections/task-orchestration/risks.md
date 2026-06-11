# Risks & Mitigation: Task Orchestration

**Feature Area**: Task Orchestration
**PDRs Referenced**: PDR-001, PDR-002, PDR-006, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements, NFRs

---

## 10. Risks & Mitigation

**Purpose**: Document the main product risks in the task-first orchestration model.

### 10.1 Risk Summary

| Risk | Category | Likelihood | Impact | Risk Score | PDR |
|------|----------|------------|--------|------------|-----|
| Task model feels too operational for simple users | Product | Medium | High | High | PDR-001, PDR-002 |
| Permission prompts interrupt task momentum too often | UX | High | Medium | High | PDR-006 |
| Repeat-task value is not strong enough to support retention | Business | Medium | Medium | Medium | PDR-008 |

### 10.2 Technical Risks

#### Risk: Task state becomes ambiguous across daemon and UI boundaries

| Attribute | Description |
|-----------|-------------|
| **Description** | Users may see stale or unclear task status if runtime, storage, and UI do not stay aligned. |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation Strategy** | Keep task lifecycle states explicit and test resume, blocked, and completion paths. |
| **Contingency Plan** | Add stronger recovery messaging and state reconciliation on reopen. |
| **Owner** | Product and engineering |

### 10.3 Market Risks

#### Risk: Users compare the product to simpler chat assistants and miss the task value

| Attribute | Description |
|-----------|-------------|
| **Description** | The product may feel heavier than chat tools before users experience continuity and completion benefits. |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation Strategy** | Make first tasks clearly useful and keep lifecycle complexity mostly behind guided surfaces. |
| **Contingency Plan** | Tighten onboarding and simplify mainstream status presentation. |
| **Owner** | Product |

### 10.4 Operational Risks

#### Risk: Supervision and approval flows create abandonment

| Attribute | Description |
|-----------|-------------|
| **Description** | Sensitive-action checkpoints can frustrate users if they happen too often or without context. |
| **Likelihood** | High |
| **Impact** | Medium |
| **Mitigation Strategy** | Reserve interruptions for meaningful risk boundaries and explain each pause clearly. |
| **Contingency Plan** | Reduce prompt frequency and offer better batching or policy controls later. |
| **Owner** | Product and UX |

### 10.5 Risk Matrix

| Likelihood \ Impact | Low | Medium | High |
|---------------------|-----|--------|------|
| **High** |  | Permission friction |  |
| **Medium** |  | Retention proof gap | Task model feels too operational |
| **Low** |  |  |  |

---

**PDR Traceability:**

| PDR | Consequence | Risk Identified |
|-----|-------------|-----------------|
| PDR-001 | Broad-audience promise can be diluted | The model may feel too technical. |
| PDR-002 | Task identity becomes central | State ambiguity undermines trust. |
| PDR-006 | Guardrails add friction | Permission prompts can reduce completion. |
| PDR-008 | Monetization is deferred | Repeat usage must prove value before commercial expansion. |
