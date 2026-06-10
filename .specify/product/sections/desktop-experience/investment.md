# Investment & Resources: Desktop Experience

**Feature Area**: Desktop Experience
**PDRs Referenced**: PDR-001, PDR-008, PDR-009
**Generated**: 2026-06-10
**Dependencies**: Requirements, Risks
**Section Number**: 10.5 (in final PRD)

---

## 10.5 Investment & Resources

**Purpose**: Describe the resourcing needed for a capable but approachable desktop shell.

### 10.5.1 Team Composition

| Role | FTEs | Phase | Duration | Responsibility |
|------|------|-------|----------|----------------|
| Product lead | 0.5-1 | Onboarding and shell prioritization | Ongoing | Shell posture and progressive disclosure |
| Frontend engineer | 1-2 | Settings and onboarding | Ongoing | Desktop UI polish |
| Desktop/platform engineer | 1 | Shell and packaging concerns | Ongoing | Electron and local integration quality |
| UX/design support | 0.5 | Mainstream usability | Targeted | Guided simple mode and information architecture |

**Total:** 3 to 4.5 FTEs average, 4.5 FTEs peak

### 10.5.2 Budget Estimate

| Category | Phase 1 | Phase 2 | Phase 3 | Annual Run Rate |
|----------|---------|---------|---------|-----------------|
| **Personnel** | Existing team allocation | Existing team allocation | Existing team allocation | Main cost driver |
| **Infrastructure** | Low incremental | Low incremental | Low incremental | Desktop packaging and QA |
| **Third-Party Services** | Minimal incremental | Minimal incremental | Minimal incremental | Not a major shell cost |
| **Tools & Licenses** | Moderate incremental | Moderate incremental | Moderate incremental | QA and release tooling |
| **Total** | **Moderate** | **Moderate** | **Moderate** | **Primarily team time** |

### 10.5.3 Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| **Optimistic** | Medium | Better mainstream adoption and retention | Positive | Value-led |
| **Base Case** | Medium | More coherent shell and reduced support burden | Positive | Value-led |
| **Pessimistic** | Low to medium | Shell remains too dense | Weak | Delayed |
| **Weighted Average** | 100% | **Positive if onboarding and first-task completion improve** | **Strategically positive** | **Driven by retention** |

### 10.5.4 Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| Guided simple mode materially improves activation | Clarification decisions | Density may still overwhelm users |
| Advanced users will tolerate progressive disclosure | Product strategy | Power users may feel constrained |
| Locale truthfulness matters to trust | Current mismatch findings | Users may notice only later, but trust cost can accumulate |

### 10.5.5 Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Onboarding review | After simple-mode polish | New users reach value quickly | Go |
| Shell coherence review | After settings pass | Advanced breadth no longer dominates first run | Go |
| Growth review | After retention evidence | Desktop shell is strong enough to support future premium expansion | Conditional |

---

**PDR Traceability:**

| PDR | Decision | Impact on Investment |
|-----|----------|---------------------|
| PDR-009 | Configurable desktop UX | Requires sustained UI and shell investment. |
| PDR-001 | Broad simple-user audience | Requires UX discipline. |
| PDR-008 | Future bundle strategy | Makes the shell a long-term strategic surface. |
