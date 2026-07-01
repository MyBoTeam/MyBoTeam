# Triage Framework: IPC Bus Renderer Daemon

**Execution Strategy**: This feature uses a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

## Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 12 | 4 | Core IPC handlers, plugin loader, lifecycle manager require human review |
| Data Operations | 3 | 2 | Type definitions, models — some can be auto-generated |
| UI Components | 2 | 1 | Preload bridge, renderer UI — preload requires careful security review |
| Integrations | 5 | 2 | Daemon connector, event forwarding — critical path needs human oversight |
| Infrastructure | 8 | 3 | Setup tasks, logging, metrics — some are boilerplate |

## Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- T004-T010: Core IPC infrastructure (protocol types, server, client, logging) — foundation for all user stories
- T015-T018: Plugin loader and render handler — core business logic with error handling
- T019, T028, T034: Preload bridge exposure — security boundary between renderer and main process
- T023-T026: Lifecycle/shutdown management — data integrity during drain and exit
- T031-T033: Plugin registry and monitoring — extensibility core with error isolation

**Agent-Delegated [ASYNC] Classifications:**

- T011-T012, T021-T022, T029-T030: Test scaffolding — follows established contract/integration test patterns
- T013-T014: Type definitions — straightforward interface/model definitions
- T020: UI component — new standalone RenderForm component
- T035: Example plugin — simple plain-text rendering implementation

## Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| T004-T010 | SYNC | Critical infrastructure | High | Core IPC protocol, server, client, logging — requires human review |
| T011-T012 | ASYNC | Test scaffolding | Low | Contract/integration test files follow established patterns |
| T013-T014 | ASYNC | Type definitions | Low | Model interfaces are straightforward type definitions |
| T015-T018 | SYNC | Business logic | High | Plugin loader, render handler, validation — core functionality |
| T019 | SYNC | Security boundary | High | Preload bridge exposes API to renderer — security-critical |
| T020 | ASYNC | UI component | Low | RenderForm is a new standalone component |
| T021-T022 | ASYNC | Test scaffolding | Low | Test files follow established patterns |
| T023-T026 | SYNC | Lifecycle management | High | Shutdown/drain logic affects data integrity |
| T027 | SYNC | Platform integration | Medium | Auto-start requires platform-specific mechanisms |
| T028 | SYNC | Security boundary | High | Preload bridge — security-critical |
| T029-T030 | ASYNC | Test scaffolding | Low | Test files follow established patterns |
| T031-T033 | SYNC | Plugin system | Medium | Plugin registry, loader, monitor — extensibility core |
| T034 | SYNC | Security boundary | High | Preload bridge — security-critical |
| T035 | ASYNC | Example plugin | Low | Simple plain-text rendering plugin |
