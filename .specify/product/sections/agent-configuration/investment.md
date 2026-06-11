# Investment & Resources: Agent Configuration

**Feature Area**: Agent Configuration
**PDRs Referenced**: PDR-001, PDR-003, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements, Risks
**Section Number**: 10.5 (in final PRD)

---

## 10.5 Investment & Resources

**Purpose**: Describe the investment required to keep configuration flexible and approachable.

### 10.5.1 Team Composition

| Role | FTEs | Phase | Duration | Responsibility |
|------|------|-------|----------|----------------|
| Product lead | 0.5-1 | Setup simplification | Ongoing | Setup flow and exposure policy |
| Frontend engineer | 1 | Settings refinement | Ongoing | Provider and model settings UX |
| Core engineer | 1 | Runtime and secrets stability | Ongoing | Provider state, runtime composition |
| UX/design support | 0.5 | Guided setup polish | Targeted | Plain-language setup and error recovery |

**Total:** 3 to 3.5 FTEs average, 3.5 FTEs peak

### 10.5.2 Budget Estimate

| Category | Phase 1 | Phase 2 | Phase 3 | Annual Run Rate |
|----------|---------|---------|---------|-----------------|
| **Personnel** | Existing team allocation | Existing team allocation | Existing team allocation | Main cost driver |
| **Infrastructure** | Low | Low | Low | Primarily local app cost |
| **Third-Party Services** | User-owned provider costs | User-owned provider costs | User-owned provider costs | Not a MyBoTeam backend cost |
| **Tools & Licenses** | Minimal incremental | Minimal incremental | Minimal incremental | Standard tooling |
| **Total** | **Moderate** | **Moderate** | **Moderate** | **Mostly team time** |

### 10.5.3 Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| **Optimistic** | Medium | Better activation with flexibility preserved | Positive | Value proof first |
| **Base Case** | Medium | Stable activation gains | Positive strategic value | Value proof first |
| **Pessimistic** | Low to medium | Setup remains too technical | Weak | Delayed |
| **Weighted Average** | 100% | **Positive if setup abandonment declines** | **Strategically positive** | **Tied to activation** |

### 10.5.4 Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| Users accept some setup if it is guided | Clarification decisions | Activation may remain weak |
| Provider flexibility improves trust and retention | Local-first and neutrality posture | Users may prefer managed simplicity |
| Built-in skills are enough for current scope | Current product decisions | Users may expect marketplace breadth too early |

### 10.5.5 Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Guided setup review | After first setup polish | Provider setup is understandable to mainstream users | Go |
| Runtime stability review | After switching validation | Provider/model changes do not break core workflows | Go |
| Bundle readiness review | After repeat-use evidence | Configuration layer is stable enough for future bundle expansion | Conditional |

---

**PDR Traceability:**

| PDR | Decision | Impact on Investment |
|-----|----------|---------------------|
| PDR-003 | Provider-neutral gateway | Requires sustained engineering and UX investment. |
| PDR-001 | Guided mainstream onboarding | Adds design and copy constraints. |
| PDR-008 | Future bundle path | Requires extensibility without immediate revenue pressure. |
