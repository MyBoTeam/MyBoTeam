# Team Context: Agent Configuration System

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | Medium |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | Medium |

_Searched 62 CDR entries, 3 matches found._

## Full Module Content

### CDR-2026-060: Source Reference Analysis Before Planning

**Rule**: Every feature plan MUST include a "Source Reference Analysis" section with specific files, line numbers, and patterns to adopt or avoid.

Key requirements:
1. Identify relevant reference implementations
2. List specific files with line numbers
3. Document patterns to adopt
4. Document patterns NOT to adopt with rationale
5. Add source references to task descriptions

### CDR-2026-061: Immediate Close on Shutdown for Daemons

**Rule**: Use `socket.destroy()` (not `socket.end()`) for immediate cleanup on shutdown.

This applies to daemon processes that need to shut down promptly. Pending writes may never complete if clients are unresponsive.

### CDR-2026-062: Lint Compliance Without Config Changes

**Rule**: Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files.

Common fix patterns:
- Use type assertions instead of `!` operator
- Prefix unused parameters with `_`
- Use `process.stdout.write` in performance-sensitive code

## Search Metadata

- Knowledge base: `/Users/mavishay/Projects/MaorInnovations/team-ai-directives`
- CDR entries searched: 62
- Matches found: 3
- Feature domain: agent-configuration, daemon, runtime
- Feature technology: TypeScript, Zod, SQLite
