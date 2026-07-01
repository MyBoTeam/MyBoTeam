# Task Strategy: IPC Bus Renderer Daemon

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for render method in apps/daemon/tests/contract/test-render.ts"
Task: "Integration test for full rendering chain in apps/desktop/tests/integration/test-render-chain.ts"

# Launch all models for User Story 1 together:
Task: "Implement Rendering Request model in packages/agent-core/src/ipc/models/render-request.ts"
Task: "Implement Rendering Plugin interface in packages/agent-core/src/ipc/models/rendering-plugin.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently
