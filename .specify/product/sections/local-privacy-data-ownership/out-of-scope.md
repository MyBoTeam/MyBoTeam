# Out of Scope: Local Privacy and Data Ownership

**Feature Area**: Local Privacy and Data Ownership
**PDRs Referenced**: PDR-005, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Define what the local-first trust model does not promise in current scope.

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| Hosted MyBoTeam account or sync service | Not part of current architecture | Separate future decision only |
| Automatic cross-device sync of sensitive state | Conflicts with local-first default | Later only with explicit architecture change |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| Silent external data flows | Violates explicit-boundary trust model | Explicit user configuration and approval |
| Cloud-default secret storage | Violates current local-first posture | Local secret handling |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Enterprise cloud-administration buyers | Not the current product focus | Possible future evaluation |
| Users seeking managed convenience over control | Not the current product tradeoff | Out of present scope |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Implicit always-on cloud sync connector | Not aligned with current trust model | Explicit user-chosen external services only |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| Hosted backend dependency | PDR-005 | Excluded | Trust model depends on local-first operation. |
| Silent sync | PDR-005 | Excluded | External boundaries must be explicit. |
| Hosted monetization coupling | PDR-008 | Excluded | Future business path should not force a backend today. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-005 | Local-first trust | Excludes hosted-default behavior. |
| PDR-008 | Future bundle model | Excludes current hosted monetization dependency. |
