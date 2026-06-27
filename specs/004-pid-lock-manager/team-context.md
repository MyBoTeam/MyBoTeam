# Team Context: PID Lock Manager

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-022 | context_modules/rules/style-guides/file_organization.md | Rule | Standards for file organization, sizing, and code structure across all languages | Medium |
| CDR-2026-020 | context_modules/rules/security/pre_commit_checklist.md | Rule | Pre-commit security checklist to verify before submitting code | Medium |

_Searched 59 CDR entries, 2 matches found._

## Search Metadata

- **Feature Domain**: process management / daemon lifecycle
- **Feature Technology**: Node.js, TypeScript, file system locking
- **Feature Patterns**: PID file, process lock, atomic file operations
- **Feature Actions**: acquire, release, detect stale locks, cleanup

## Notes

- No CDR directly covers PID file management or process locking patterns
- The file_organization rule informs code structure (200-400 line target, single responsibility)
- The pre_commit_checklist is tangentially relevant (no hardcoded secrets, proper error handling)
- Source reference: v0.2.0 (`packages/daemon/src/pid-lock.ts`) — class-based, plain-text PID
- Source reference: v0.3.0 (`packages/agent-core/src/daemon/pid-lock.ts`) — functional API, JSON payload, atomic linkSync
- v0.4.0 and v0.5.0 have no PID lock implementation — this is a fresh implementation
