# Team Context: Crash Recovery — PID Detection, Stale Tasks

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | High |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | Medium |

_Searched 62 CDR entries, 3 matches found._

### CDR-2026-060: Source Reference Analysis Before Planning

Every feature plan MUST include a "Source Reference Analysis" section with specific files, line numbers, and patterns to adopt or avoid.

### CDR-2026-061: Immediate Close on Shutdown for Daemons

Use `socket.destroy()` (not `socket.end()`) for immediate cleanup on shutdown. This ensures the daemon can shut down promptly without waiting for unresponsive clients.

### CDR-2026-062: Lint Compliance Without Config Changes

Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files.
