# Investment & Resources: Connectors and Automation Tools

**Feature Area**: Connectors and Automation Tools
**PDRs Referenced**: PDR-004, PDR-007, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements, Risks
**Section Number**: 10.5 (in final PRD)

---

## 10.5 Investment & Resources

**Purpose**: Describe the resourcing needed for dependable built-in action capabilities.

### 10.5.1 Team Composition

| Role | FTEs | Phase | Duration | Responsibility |
|------|------|-------|----------|----------------|
| Product lead | 0.5-1 | Capability prioritization | Ongoing | Built-in capability scope and sequencing |
| Integration engineer | 1-2 | Connector families | Ongoing | Connector auth and service reliability |
| Automation engineer | 1 | Browser and desktop flows | Ongoing | Execution quality and recovery |
| UX/design support | 0.5 | Trust and approvals | Targeted | Outcome-first exposure and permission UX |

**Total:** 3 to 4.5 FTEs average, 4.5 FTEs peak

### 10.5.2 Budget Estimate

| Category | Phase 1 | Phase 2 | Phase 3 | Annual Run Rate |
|----------|---------|---------|---------|-----------------|
| **Personnel** | Existing team allocation | Existing team allocation | Existing team allocation | Main cost driver |
| **Infrastructure** | Moderate maintenance | Moderate maintenance | Moderate maintenance | Dependent on shipped connectors |
| **Third-Party Services** | Connector-dependent | Connector-dependent | Connector-dependent | Mostly user-owned external services |
| **Tools & Licenses** | Moderate incremental | Moderate incremental | Moderate incremental | Automation and QA tooling |
| **Total** | **Moderate to high** | **Moderate to high** | **Moderate** | **Primarily team time** |

### 10.5.3 Risk-Adjusted ROI

| Scenario | Probability | 12-Month ROI | NPV (3-year) | Payback Period |
|----------|-------------|--------------|--------------|----------------|
| **Optimistic** | Medium | Strong differentiation and repeat use | Positive | Value-led |
| **Base Case** | Medium | Better completion of real tasks | Positive | Value-led |
| **Pessimistic** | Low to medium | Reliability costs outweigh short-term benefits | Weak | Delayed |
| **Weighted Average** | 100% | **Positive if built-in capabilities improve useful completion reliably** | **Strategically positive** | **Depends on reuse and future bundle demand** |

### 10.5.4 Key Assumptions

| Assumption | Basis | Risk if Wrong |
|------------|-------|---------------|
| Built-in capabilities are enough to prove differentiated value | Current product decisions | Users may expect broader catalogs too early |
| Outcome-first framing can contain complexity | Clarification decisions | Users may still perceive the product as technical |
| Reliable action capability increases retention | Product strategy | Failures may erase trust gains |

### 10.5.5 Go/No-Go Criteria

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| Built-in capability review | After core connector polish | Shipped families complete meaningful tasks reliably | Go |
| Trust review | After approval UX pass | Users understand and accept auth and permission boundaries | Go |
| Bundle readiness review | After repeat-use proof | Capabilities show enough reuse to justify later packaging | Conditional |

---

**PDR Traceability:**

| PDR | Decision | Impact on Investment |
|-----|----------|---------------------|
| PDR-004 | Built-in primitives | Requires first-party maintenance investment. |
| PDR-007 | Action differentiation | Increases quality and trust costs. |
| PDR-008 | Future bundles | Adds strategic upside after value proof. |
