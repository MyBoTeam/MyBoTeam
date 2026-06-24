# Out of Scope: System

**Feature Area**: System
**PDRs Referenced**: PDR-001, PDR-002, PDR-003
**Generated**: 2026-06-24
**Dependencies**: Requirements

---

## 9. Out of Scope

**Purpose**: Define explicit exclusions to set clear boundaries

### 9.1 Feature Exclusions

| Excluded Feature | Rationale | Future Consideration |
|------------------|-----------|----------------------|
| Developer/Tech Agent | Targets a different (technical) persona; would dilute MVP focus | Post-MVP (PDR-001) |
| Agent Marketplace | Requires significant platform investment (curation, payments, reviews) | Future product phase |
| Granular autonomy levels | Adds complexity without proven user demand | Future product phase |
| Cloud sync / multi-device | Contradicts local-first privacy positioning | Maybe never (business decision) |
| Mobile app (iOS/Android) | Desktop-only for MVP; mobile agent UI is a separate challenge | Future consideration |

### 9.2 Technical Exclusions

| Excluded Capability | Rationale | Alternative |
|---------------------|-----------|-------------|
| Cloud-hosted LLM proxy | Violates privacy promise; adds infrastructure cost and liability | BYOK direct calls only |
| Third-party authentication (OAuth to Google/Microsoft) | Adds scope; user can manually configure calendar/email integration | Manual config via MCP |
| Plugin SDK for third-party developers | Premature before marketplace is built | Custom MCP servers as interim |
| Windows/macOS auto-updater | Handled by app store infrastructure | Store-based updates only |

### 9.3 Market Exclusions

| Excluded Market/Segment | Rationale | Future Consideration |
|-------------------------|-----------|----------------------|
| Enterprise (50+ employees) | Needs SSO, team management, compliance, cloud deployment | Future enterprise tier |
| Developer / Engineer | Not the target persona; these users build their own tools | Developer Agent post-MVP |
| Non-English markets | English-only MVP; localization adds significant scope | Post-MVP |

### 9.4 Integration Exclusions

| Excluded Integration | Rationale | Workaround |
|----------------------|-----------|------------|
| Native Outlook/Exchange calendar API | Adds significant scope; Google Calendar is sufficient for MVP | Manual export/import or MCP bridge |
| QuickBooks/Xero native API | Complex OAuth flows; spreadsheet-based tracking covers MVP needs | CSV export for import into accounting software |
| Slack/Teams integration | Communication agents are Secretary scope, but chat integrations deferred | Post-MVP |

### 9.5 Scope Decisions Traced to PDRs

| Out of Scope Item | PDR | Decision | Rationale |
|-------------------|-----|----------|-----------|
| Developer/Tech Agent | PDR-001 | MVP Agent Set | Different persona; post-MVP |
| Agent Marketplace | PDR-003 | Monetization Strategy | Requires platform investment; future phase |
| Enterprise features | PDR-002 | Target Persona | Primary persona is solopreneur, not enterprise |

---

**PDR Traceability:**

| PDR | Decision | Impact on Scope |
|-----|----------|-----------------|
| PDR-001 | MVP Agent Set | Developer agent, tech features excluded from MVP |
| PDR-002 | Target Persona | Enterprise and developer segments excluded |
| PDR-003 | Monetization | Marketplace and premium features deferred |
