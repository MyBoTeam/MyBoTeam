# Discovered Team Context (Plan Phase)

## Architecture Patterns

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-008 | context_modules/rules/architecture/dependency_injection.md | Rule | Use dependency injection for loose coupling and testability | High |
| CDR-2026-060 | context_modules/rules/architecture/source_reference_analysis.md | Rule | Mandatory source code analysis from previous versions before implementing features | High |
| CDR-2026-061 | context_modules/rules/architecture/immediate_close_shutdown.md | Rule | Use socket.destroy() instead of socket.end() for immediate cleanup on daemon shutdown | High |

## Implementation Guidelines

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-062 | context_modules/rules/devops/lint_compliance_no_config_changes.md | Rule | Fix code to match existing lint rules rather than weakening the rules | High |
| CDR-2026-020 | context_modules/rules/security/pre_commit_checklist.md | Rule | Pre‑commit security checklist to verify before submitting code | High |
| CDR-2026-017 | context_modules/rules/devops/secrets_management.md | Rule | Secrets management patterns for Kubernetes using External Secrets Operator | High |

_Searched 62 CDR entries, 6 matches found._