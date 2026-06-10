# Problem: Agent Configuration

**Feature Area**: Agent Configuration
**PDRs Referenced**: PDR-001, PDR-003
**Generated**: 2026-06-10
**Dependencies**: Overview
**Section Number**: 3 (in final PRD)

---

## 3. The Problem

**Purpose**: Explain why provider-neutral configuration is necessary but also risky for a simple-user product.

### 3.1 Problem Statement

Users need access to different AI providers and models, but provider setup, credentials, and model choice can quickly overwhelm the mainstream audience MyBoTeam is targeting.

### 3.2 Problem Context

**Current State:**

- The product already supports multiple providers, local-model options, and model selection.
- Users still need to connect a provider in current scope.

**Pain Points:**

- Provider setup creates friction before users experience any task value.
- Model and credential terminology can make the product feel technical too early.
- A single-provider path would simplify onboarding but weaken trust, flexibility, and local-model support.

**Impact of Not Solving:**

- Lower activation because users bounce during setup.
- Weaker local-first story if the product silently collapses to one hosted backend.
- Reduced future flexibility for bundles, skills, and advanced users.

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| README and settings routes | Existing product surface | Multi-provider support is already core product behavior. |
| Provider storage and runtime config | Agent-core implementation | Provider state and models are first-class runtime inputs. |
| Clarification decisions | Product decisions | Setup must stay required for now, but delayed and simplified. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-001 | Broad simple-user positioning | Setup complexity is a product problem, not only a technical one. |
| PDR-003 | Provider-neutral gateway | Choice and flexibility are required capabilities. |
