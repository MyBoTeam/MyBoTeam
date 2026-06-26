# I18 Fix: Quickstart Update Tasks

## Problem
`specs/003-sqlite-storage-layer/quickstart.md` is outdated — contains:
- Wrong import path (`@myboteam/storage/agent-storage` → `@myboteam/agent-core/storage`)
- Wrong module structure (references `@myboteam/storage` package instead of `@myboteam/agent-core`)
- Outdated initialization pattern
- Missing new features (pinned, type filter, document versions)

## Tasks

### T058: Update quickstart.md
- [ ] Update import path to `@myboteam/agent-core/storage`
- [ ] Update initialization example (WAL, Pino logger, `:memory:` for tests)
- [ ] Add CRUD examples for all 8 entities
- [ ] Add query filter examples (pinned, type, agentId)
- [ ] Add document versioning example
- [ ] Add error handling pattern
- [ ] Remove reference to `@myboteam/storage` package
- [ ] Add test mode example with `:memory:`

### T059: Validate quickstart.md
- [ ] Run quickstart.md examples against actual API (dry run)
- [ ] Verify all import paths resolve
- [ ] Verify all method signatures match implementation

## Verification
```bash
cd packages/agent-core
npx vitest run tests/unit/storage/
# All 153 tests should pass
```
