# Team Context Discovery

**Feature**: M2-5: Data directory manager
**Domain**: Local file system, path resolution, cross-platform compatibility
**Technology**: Node.js/TypeScript
**Patterns**: File system operations, environment variable configuration

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-022 | context_modules/rules/style-guides/file_organization.md | Rule | Standards for file organization, sizing, and code structure across all languages | High |

## Search Metadata

_Searched 59 CDR entries, 1 match found._

## Module Content

### CDR-2026-022: File Organization and Structure

**Relevance**: High - Directly applicable to organizing the data directory manager code structure.

Key principles:
- Target 200-400 lines per file, max 800
- Organize by feature/domain, not by type
- Keep related code together
- Co-locate tests with source files

**Application to Data Directory Manager**:
- Create a dedicated module for path resolution logic
- Keep cross-platform path handling separate from business logic
- Co-locate unit tests with the path resolution module
