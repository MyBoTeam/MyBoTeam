# Risks & Mitigation: Local Privacy and Data Ownership

**Feature Area**: Local Privacy and Data Ownership
**PDRs Referenced**: PDR-001, PDR-005, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements, NFRs

---

## 10. Risks & Mitigation

**Purpose**: Document the key risks in the local-first trust model.

### 10.1 Risk Summary

| Risk | Category | Likelihood | Impact | Risk Score | PDR |
|------|----------|------------|--------|------------|-----|
| Trust language is too technical for mainstream users | UX | Medium | High | High | PDR-001, PDR-005 |
| Recovery and migration complexity undermine local-first trust | Operational | Medium | High | High | PDR-005 |
| Future commercial pressure weakens the local-first posture | Business | Low to medium | High | Medium | PDR-008 |

### 10.2 Technical Risks

#### Risk: Local state protection is credible but inconvenient

| Attribute | Description |
|-----------|-------------|
| **Description** | Strong local boundaries can introduce recovery or migration pain if product flows remain rough. |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation Strategy** | Keep backup, export, and recovery on the roadmap and expose clear support paths. |
| **Contingency Plan** | Add stronger import/export tools when adoption data supports it. |
| **Owner** | Product and engineering |

### 10.3 Market Risks

#### Risk: Trust positioning fails to land with simple users

| Attribute | Description |
|-----------|-------------|
| **Description** | Users may not understand or value the local-first model if it is explained abstractly. |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation Strategy** | Lead with usefulness, then explain local control in plain language. |
| **Contingency Plan** | Rewrite trust messaging and tie it to specific behaviors. |
| **Owner** | Product |

### 10.4 Operational Risks

#### Risk: External boundaries create confusing setup friction

| Attribute | Description |
|-----------|-------------|
| **Description** | Explicit provider or connector setup may feel like friction rather than trust. |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Mitigation Strategy** | Keep prompts contextual and explicit only when needed. |
| **Contingency Plan** | Further streamline setup and clarify why prompts exist. |
| **Owner** | Product and UX |

### 10.5 Risk Matrix

| Likelihood \ Impact | Low | Medium | High |
|---------------------|-----|--------|------|
| **High** |  |  |  |
| **Medium** |  | Setup friction | Technical trust messaging misses |
| **Low** |  |  | Commercial pressure weakens trust posture |

---

**PDR Traceability:**

| PDR | Consequence | Risk Identified |
|-----|-------------|-----------------|
| PDR-005 | Local-first trust is central | Recovery and communication risks become strategic. |
| PDR-001 | Broad user audience | Trust messaging may miss non-technical users. |
| PDR-008 | Future bundle direction | Business pressure could distort current trust posture later. |
