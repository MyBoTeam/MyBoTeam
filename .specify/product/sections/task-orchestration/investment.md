# Investment & Resources: Task Orchestration

**Feature Area**: Task Orchestration
**PDRs Referenced**: PDR-001, PDR-002, PDR-006, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements, Risks
**Section Number**: 10.5 (in final PRD)

---

## 10.5 Investment & Resources

**Purpose**: Describe the resource focus needed to make task orchestration the product backbone.

### 10.5.1 Team Composition

| Role | FTEs | Phase | Duration | Responsibility |
|------|------|-------|----------|----------------|
| Product lead | 1 | Foundation to launch | Ongoing | Task model, prioritization, checkpoint policy |
| Frontend engineer | 1-2 | Foundation to polish | Ongoing | Entry points, status UI, history, favorites |
| Daemon/core engineer | 1-2 | Foundation to polish | Ongoing | Task runtime, persistence, scheduling, recovery |
| Design/UX support | 0.5 | Guided onboarding and trust flows | Targeted | Permission and completion clarity |

**Total:** 3.5 to 5.5 FTEs average, 5.5 FTEs peak

### 10.5.2 Budget Estimate

| Category | Phase 1 | Phase 2 | Phase 3 | Annual Run Rate |
|----------|---------|---------|---------|-----------------|
| **Personnel** | Existing team allocation | Existing team allocation | Existing team allocation | Main cost driver |
| **Infrastructure** | Low incremental | Low incremental | Low incremental | Primarily local-app architecture |
| **Third-Party Services** | Provider-dependent, user-configured | Provider-dependent | Provider-dependent | Not a hosted backend cost center |
| **Tools & Licenses** | Minimal incremental | Minimal incremental | Minimal incremental | Standard engineering tooling |
| **Total** | **Moderate product focus** | **Moderate product focus** | **Moderate product focus** | **Dominated by team time** |

### 10.5.3 Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| **Optimistic** | Medium | Strong retention and repeat-task lift | Positive if bundles later convert | Depends on later monetization |
| **Base Case** | Medium | Better activation and retention | Positive strategic value | Driven by free-core adoption |
| **Pessimistic** | Low to medium | Limited lift if tasks feel too complex | Weak | Delayed |
| **Weighted Average** | 100% | **Positive if useful completion rate improves materially** | **Strategically favorable** | **Requires value proof before pricing** |

### 10.5.4 Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| Task continuity improves retention | PDR clarifications and existing task architecture | The core loop may not justify the added complexity |
| Guardrails can stay understandable | Existing permission surfaces and trust positioning | Users may still abandon sensitive tasks |
| Free-core usage can prove demand | Current monetization direction in PDR-008 | Future bundle strategy may lack evidence |

### 10.5.5 Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Task foundation review | After core lifecycle polish | Durable task identity and clear status handling work reliably | Go |
| Repeat-use review | After favorites and scheduling validation | Users reuse or return to tasks often enough to justify deeper investment | Go |
| Monetization readiness review | After retention evidence exists | Free-core task value is strong enough to support future bundles | Conditional |

---

**PDR Traceability:**

| PDR | Decision | Impact on Investment |
|-----|----------|---------------------|
| PDR-002 | Task is the primary workflow unit | Makes this area a foundational investment. |
| PDR-006 | Guardrailed automation | Adds UX and quality investment to technical work. |
| PDR-008 | Monetization later | Keeps investment justified by retention and value proof first. |
