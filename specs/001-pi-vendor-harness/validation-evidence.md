# MAO-66 Validation Evidence

## Status Legend

- `pass`
- `fail`
- `approved-exclusion`
- `approved-gap`
- `blocked`
- `not-run`

## Evidence Items

| Status | Scope Item | Environment | Command / Result | Evidence Link | Reviewer | Secret-Safety Note | Residual Risk |
|--------|------------|-------------|------------------|---------------|----------|--------------------|---------------|
| not-run | Phase 1 setup | local | Pending implementation | N/A | N/A | No credentials used | Not yet validated |
| pass | Phase 2 static verification | local | `pnpm check` passed; Biome checked 1532 files and fixed 2 formatting issues; TypeScript passed all workspaces | local command output | Codex | No credentials used | None |
| pass | Phase 2 agent-core unit tests | local escalated socket permission | `pnpm -F @myboteam/agent-core test` passed: 102 files, 1297 passed, 1 skipped | local command output | Codex | No credentials used | None |
| pass | Phase 2 daemon unit tests | local escalated socket permission | `pnpm -F @myboteam/daemon test` passed: 28 files, 355 passed | local command output | Codex | No credentials used | None |
| pass | Phase 2 pi-agent-core unit tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 3 files, 6 passed | local command output | Codex | No credentials used | None |
| pass | US1 focused regression tests | local | Focused agent-core, daemon, and web tests passed for current harness lifecycle, event forwarding, task-source routing, permissions, and selector absence | local command output | Codex | No credentials used | None |
| pass | US1 agent-core regression | local escalated socket permission | `pnpm -F @myboteam/agent-core test` passed: 103 files, 1299 passed, 1 skipped | local command output | Codex | No credentials used | None |
| pass | US1 daemon regression | local escalated socket permission | `pnpm -F @myboteam/daemon test` passed: 28 files, 357 passed | local command output | Codex | No credentials used | None |
| pass | US2 pi-vendor copied source and package boundary | local | `pnpm -F @myboteam/pi-vendor exec tsc --noEmit` passed; `pnpm -F @myboteam/pi-vendor test` passed: 1 file, 1 test | local command output | Codex | No credentials used | Pi runtime adapter and live parity checks remain pending |
| pass | US2 Pi event mapper tests | local | `pnpm -F @myboteam/pi-agent-core exec vitest run tests/unit/pi-event-text-mapping.test.ts tests/unit/pi-event-tool-mapping.test.ts` passed: 2 files, 4 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Runtime wiring, permission, provider, and tool/MCP bridge parity remain pending |
| pass | US2 Pi terminal-state tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 6 files, 17 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Runtime adapter wiring remains pending |
| pass | US2 Pi permission bridge tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 7 files, 20 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Runtime adapter wiring and live permission flow remain pending |
| pass | US2 Pi provider/model resolver tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 8 files, 23 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Live provider credential validation remains pending |
| pass | US2 Pi tool/MCP/connector bridge contract tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 9 files, 27 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Live capability execution parity remains pending |
| pass | US2 Pi browser frame mapper tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 10 files, 29 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Live browser frame emission remains pending |
| pass | US2 Pi diagnostic redaction tests | local | `pnpm -F @myboteam/pi-agent-core test` passed: 11 files, 30 tests; `pnpm -F @myboteam/pi-agent-core exec tsc --noEmit` passed | local command output | Codex | No credentials used | Full log-path integration remains pending |

## Approved Exclusions

None recorded.

## Approved Validation Gaps

None recorded.

## Deprecation Approval

- Automated checks: not-run
- Full live credentialed tool/MCP/connector regression: not-run
- Maintainer approval: not-run
- Current harness deprecation marker applied: no

## Secret Safety Notes

Provider secrets, connector tokens, credential material, raw private prompts, screenshots, traces, and logs must not be pasted into this evidence file. Link only to sanitized excerpts.
