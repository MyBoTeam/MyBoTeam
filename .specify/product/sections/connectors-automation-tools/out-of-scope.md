# Out of Scope: Connectors and Automation Tools

**Feature Area**: Connectors and Automation Tools
**PDRs Referenced**: PDR-004, PDR-007, PDR-008
**Generated**: 2026-06-10
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Define what current built-in capability scope does not promise.

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| Open marketplace as the main current feature | Product scope is built-in capabilities first | Roadmap |
| Unrestricted background automation by default | Trust and approval model does not allow it | Possible advanced opt-in later |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| User-facing MCP complexity as mainstream UX | Too technical for primary audience | Outcome-first task flows |
| Fully generic third-party plugin platform | Too broad for current scope | First-party capability families |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Marketplace sellers as the main current audience | Not the current product stage | Later ecosystem development |
| Enterprise automation suite positioning | Too far from current simple-user focus | Future evaluation only |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Broad open connector catalog beyond current first-party families | Not yet productized | Use shipped built-in families |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| Marketplace-first discovery | PDR-008 | Excluded | Current product value is built-in. |
| Unrestricted default automation | PDR-007 | Excluded | Trust and supervision still govern. |
| Generic plugin platform | PDR-004 | Excluded | First-party primitives are the current path. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-004 | Built-in skill and connector focus | Excludes generic ecosystem-first scope. |
| PDR-007 | Safe automation posture | Excludes unrestricted defaults. |
| PDR-008 | Marketplace later | Excludes current marketplace-first productization. |
