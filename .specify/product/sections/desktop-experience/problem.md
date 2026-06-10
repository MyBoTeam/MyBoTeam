# Problem: Desktop Experience

**Feature Area**: Desktop Experience
**PDRs Referenced**: PDR-001, PDR-009
**Generated**: 2026-06-10
**Dependencies**: Overview
**Section Number**: 3 (in final PRD)

---

## 3. The Problem

**Purpose**: Explain the tension between a powerful desktop control center and a simple-user first-run experience.

### 3.1 Problem Statement

MyBoTeam already exposes a wide desktop surface with many settings and advanced capabilities. Without a guided experience, that breadth can overwhelm the broad simple-user audience the product is targeting.

### 3.2 Problem Context

**Current State:**

- The desktop shell includes settings for providers, skills, browsers, integrations, scheduler, voice, workspaces, language, theme, and more.
- The product ships multiple locales and configurable preferences.

**Pain Points:**

- Showing all controls upfront can turn onboarding into a settings tour.
- Public language can drift from current shipped locale and feature support.
- Advanced features like workspaces, scheduling, and voice can overshadow the simple first task.

**Impact of Not Solving:**

- Lower first-task completion for new users.
- Weaker product clarity because the surface feels busy or technical.
- Mismatch between current support and public claims.

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| Settings routes and app shell | Existing product surface | The desktop experience is broad and configurable today. |
| Locale directories | Web locales | Current shipped locales are explicit and limited. |
| Clarification decisions | Product decisions | Guided simple mode is the chosen onboarding stance. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-009 | Configurable internationalized desktop UX | Defines the breadth and tension in the current shell. |
| PDR-001 | Broad simple-user positioning | Makes guided onboarding a product necessity. |
