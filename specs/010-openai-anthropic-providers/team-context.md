# Team Context: MAO-153 OpenAI + Anthropic Providers

**Feature**: M4-2: OpenAI + Anthropic providers
**Discovery Date**: 2026-07-02
**Knowledge Base**: /Users/mavishay/Projects/MaorInnovations/team-ai-directives

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | Medium |
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | High |

_Searched 62 CDR entries, 3 matches found._

---

## CDR-2026-060: Source Reference Analysis Before Planning

**Type**: Rule | **Relevance**: High

### Summary

Supplementary example demonstrating how to apply Constitution Principle VII (Source Reference MANDATORY). Every feature plan MUST include a "Source Reference Analysis" section with specific files, line numbers, and patterns to adopt or avoid.

### Decision

Every `plan.md` MUST include a "Source Reference Analysis" section containing:

1. **Specific files analyzed** with line numbers
2. **Key patterns to adopt** from reference implementations
3. **Patterns NOT to adopt** with rationale for exclusion
4. **Exact file:line references** in task descriptions

---

## CDR-2026-062: Lint Compliance Without Config Changes

**Type**: Rule | **Relevance**: High

### Summary

Supplementary example demonstrating how to apply Constitution Principle IX (Linter/Formatter Configs Are Protected). When biome reports lint errors, fix the code to match existing rules rather than weakening the rules.

### Decision

Always fix code to match existing lint rules. Never modify `biome.json`, `.eslintrc`, `tsconfig.json`, or similar tooling configuration files.

### Common Fix Patterns

1. **noNonNullAssertion (`!`)**: Use type assertion or optional chaining
2. **noUnusedParameters**: Prefix with underscore `_`
3. **noConsole**: Use `process.stdout.write` in performance-sensitive code

---

## Feature Context

- **Domain**: LLM integration, AI providers
- **Technology**: TypeScript, Node.js, APIs (OpenAI, Anthropic)
- **Patterns**: SSE streaming, API clients, error handling
- **Actions**: Chat completion, streaming, model listing
