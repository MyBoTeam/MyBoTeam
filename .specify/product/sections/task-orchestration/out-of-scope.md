# Out of Scope: Task Orchestration

**Feature Area**: Task Orchestration
**PDRs Referenced**: PDR-001, PDR-002, PDR-006, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Define what this area deliberately does not commit to in the current product scope.

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| Workspace-first task orchestration as the default model | Conflicts with the guided simple-user entry point | Advanced users only, later refinement |
| Paid task catalogs or monetized task packaging | Current product value must be proven in the free core first | Future marketplace scope |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| Fully autonomous no-approval execution by default | Conflicts with guardrailed trust model | Opt-in higher autonomy later |
| Cloud-hosted MyBoTeam task backend | Conflicts with local-first current architecture | Continue local persistence model |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Enterprise workflow administration as the main current audience | The product is currently aimed at broad simple users | Can be revisited if the product surface matures |
| Heavy operations-console positioning | Weak fit for mainstream onboarding | Keep advanced controls secondary |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Dedicated billing integration for task packages | No current paid task model | None needed in current scope |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| Workspace-first default | PDR-002 | Excluded for first-run users | Keeps the product centered on direct task entry. |
| Fully autonomous default actions | PDR-006 | Excluded | Trust and supervision take precedence. |
| Paid task packaging | PDR-008 | Excluded for now | Commercial scope is roadmap only. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-001 | Broad simple-user positioning | Excludes operator-style default workflows. |
| PDR-002 | Task-first model | Excludes workspace-first complexity. |
| PDR-006 | Guardrails first | Excludes unsupervised default execution. |
| PDR-008 | Free-core current scope | Excludes monetized task surfaces for now. |
