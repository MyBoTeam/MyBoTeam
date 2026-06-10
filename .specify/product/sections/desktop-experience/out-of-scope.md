# Out of Scope: Desktop Experience

**Feature Area**: Desktop Experience
**PDRs Referenced**: PDR-008, PDR-009
**Generated**: 2026-06-10
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Define what the desktop product surface is not committing to right now.

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| Workspaces as the default first-run pillar | Too advanced for the chosen onboarding posture | Advanced users later |
| Voice as a primary launch pillar | Secondary convenience feature | Later refinement |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| Claiming RTL as current shipped support | Not backed by current locale evidence | Keep as roadmap |
| Forcing users through all settings before first task | Hurts mainstream activation | Guided simple mode |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Power-user-only desktop automation platform messaging | Too narrow for current product direction | Balance later if needed |
| Enterprise admin-console positioning | Not current product focus | Future evaluation only |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Treating advanced integrations as mandatory during onboarding | First-run value should come earlier | Progressive discovery later |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| RTL-as-current support | PDR-009 | Excluded | Current support must reflect shipped locales. |
| Workspace-first onboarding | PDR-009 | Excluded | Guided simple mode comes first. |
| Paid-shell-first experience | PDR-008 | Excluded | Free core remains the main product surface. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-009 | Guided simple mode, current locale truthfulness | Excludes advanced-first and unsupported-current claims. |
| PDR-008 | Future bundles later | Excludes commercial-first shell framing. |
