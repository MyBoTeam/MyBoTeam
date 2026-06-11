# Problem: Connectors and Automation Tools

**Feature Area**: Connectors and Automation Tools
**PDRs Referenced**: PDR-004, PDR-007
**Generated**: 2026-06-10
**Dependencies**: Overview
**Section Number**: 3 (in final PRD)

---

## 3. The Problem

**Purpose**: Explain why MyBoTeam needs first-party tools and automation instead of stopping at generated text.

### 3.1 Problem Statement

Many useful user tasks require action in external systems, browsers, documents, or messaging contexts. A product that only responds in text cannot complete these workflows end to end.

### 3.2 Problem Context

**Current State:**

- The codebase already includes bundled skills, MCP tools, connector auth flows, and browser automation packages.
- Mainstream users should not need to understand these implementation details to benefit from them.

**Pain Points:**

- Chat-only assistance leaves users to perform the actual work manually.
- Tool-heavy interfaces can feel technical or intrusive to simple users.
- Marketplace language can imply capabilities that are not yet productized.

**Impact of Not Solving:**

- Weaker differentiation from general assistants.
- Lower completion for tasks that need browser, connector, or file actions.
- Lost opportunity to demonstrate value through built-in capabilities.

### 3.3 Problem Validation

| Evidence Type | Source | Finding |
|---------------|--------|---------|
| Bundled tool families | Agent-core MCP packages | Multiple built-in connector and automation tool families exist already. |
| Daemon routes and services | Existing daemon implementation | Google and WhatsApp service layers are real product assets. |
| Product positioning | README and PDRs | Automation and desktop/browser action are part of the value promise. |

---

**PDR Traceability:**

| PDR | Decision | Impact on Problem Definition |
|-----|----------|------------------------------|
| PDR-004 | Extensibility primitives | Built-in tools are part of the product surface. |
| PDR-007 | Automation differentiation | Outcome completion requires action, not just text. |
