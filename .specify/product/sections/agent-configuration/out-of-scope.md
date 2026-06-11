# Out of Scope: Agent Configuration

**Feature Area**: Agent Configuration
**PDRs Referenced**: PDR-001, PDR-003, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Set boundaries for the current configuration surface.

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| MyBoTeam-managed hosted model service | Not part of current architecture | Could be reconsidered separately later |
| Marketplace-first skill acquisition | Current scope is built-in skills | Roadmap only |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| Raw config editing as the primary UX | Too technical for the target audience | Guided settings surfaces |
| Automatic secret syncing to cloud | Conflicts with local-first trust | Keep local storage |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Enterprise procurement-led AI platform buying | Not the current audience | Possible future exploration |
| Developers seeking plugin-platform-first tooling | Too early for current product scope | Future ecosystem work |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Paid billing integration for providers | No current product billing layer | Users bring their own provider accounts |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| Hosted MyBoTeam backend | PDR-003 | Excluded | Preserves provider neutrality and current architecture. |
| Marketplace-first setup | PDR-008 | Excluded | Current scope is built-in value. |
| Raw config-first UX | PDR-001 | Excluded | Conflicts with guided simple onboarding. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-001 | Broad simple-user focus | Excludes config-first technical UX. |
| PDR-003 | Provider neutrality | Excludes single managed backend shortcut. |
| PDR-008 | Future bundles later | Excludes marketplace-first flows today. |
