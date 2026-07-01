# Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | High |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | High |

_Searched 62 CDR entries, 3 matches found._

---

## CDR-2026-060: Source Reference Analysis Before Planning

**Type**: Rule
**Descriptor**: Mandatory source code analysis from previous versions before implementing features

Every `plan.md` MUST include a "Source Reference Analysis" section containing:

1. **Specific files analyzed** with line numbers
2. **Key patterns to adopt** from reference implementations
3. **Patterns NOT to adopt** with rationale for exclusion
4. **Exact file:line references** in task descriptions

**Checklist**:
- Identified relevant reference implementations
- Listed specific files with line numbers
- Documented patterns to adopt
- Documented patterns NOT to adopt with rationale
- Added source references to task descriptions

---

## CDR-2026-061: Immediate Close on Shutdown for Daemons

**Type**: Rule
**Descriptor**: Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown

On daemon/server shutdown, immediately destroy all client sockets without waiting for pending writes. This prevents hanging during shutdown and ensures clean resource cleanup.

**Decision**: Use `socket.destroy()` (not `socket.end()`) for immediate cleanup on shutdown.

**When to Use**:
- Daemon/server shutdown handlers
- Process signal handlers (SIGTERM, SIGINT)
- Cleanup on uncaught exceptions

**When NOT to Use**:
- Client-initiated graceful disconnect (use `end()`)
- Data integrity critical scenarios
- Non-daemon processes with long-running connections

---

## CDR-2026-062: Lint Compliance Without Config Changes

**Type**: Rule
**Descriptor**: Fix code to match existing lint rules rather than weakening the rules

Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files.

**Common Fix Patterns**:
1. **noNonNullAssertion (`!`)**: Use type assertions or optional chaining
2. **noUnusedParameters**: Prefix with underscore (`_param`)
3. **noConsole**: Use `process.stdout.write` in performance-sensitive code

**Checklist**:
- Read the lint error message carefully
- Fix the code, not the config
- Use type assertions instead of `!` operator
- Prefix unused parameters with `_`
- Use `process.stdout.write` in performance-sensitive code
- Verify fix with `pnpm lint`
