# Team Context: M4-1 ProviderClient Interface

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | Medium |

_Searched 62 CDR entries, 2 matches found._

## Module Content

### CDR-2026-060: Source Reference Analysis Before Planning

**Rule**: Every feature plan MUST include a "Source Reference Analysis" section with specific files, line numbers, and patterns to adopt or avoid.

- Source: v0.2.0 (`packages/daemon/src/conversation-provider.ts`)
- Key pattern: Unified API caller `callProviderApi()` handling OpenAI and Anthropic APIs with SSE streaming

### CDR-2026-062: Lint Compliance Without Config Changes

**Rule**: Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files.

- Use type assertions instead of `!` operator
- Prefix unused parameters with `_`
- Use `process.stdout.write` in performance-sensitive code
