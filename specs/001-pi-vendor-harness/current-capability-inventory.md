# Current Capability Inventory

This inventory defines the MAO-66 parity scope for T039, T052, T053, T097, and T098. Implementation must update this file from source inspection before live validation is accepted.

## Providers And Models

| Item | Source File(s) | Validation Owner | Parity Status |
|------|----------------|------------------|---------------|
| Standard provider settings and default models | `packages/agent-core/src/common/types/providerSettings.ts` | Maintainer | not-run |
| Provider validation helpers | `packages/agent-core/src/providers/` | Maintainer | not-run |

## Built-In Tools

| Item | Source File(s) | Validation Owner | Parity Status |
|------|----------------|------------------|---------------|
| OpenCode-compatible task tools | `packages/agent-core/src/internal/classes/adapter-tools.ts` | Maintainer | not-run |
| Browser automation events/tools | `packages/agent-core/src/browser/`, `apps/daemon/src/task-event-forwarding.ts` | Maintainer | not-run |

## MCP Capabilities

| Item | Source File(s) | Validation Owner | Parity Status |
|------|----------------|------------------|---------------|
| Bundled MCP tool generation | `packages/agent-core/src/opencode/generator-mcp-tools.ts` | Maintainer | not-run |
| MCP connector routes | `apps/daemon/src/daemon-routes-mcp.ts` | Maintainer | not-run |

## Connectors

| Item | Source File(s) | Validation Owner | Parity Status |
|------|----------------|------------------|---------------|
| OAuth connector tokens and metadata | `packages/agent-core/src/connectors/`, `apps/daemon/src/connector-service.ts` | Maintainer | not-run |
| WhatsApp task bridge | `apps/daemon/src/whatsapp/taskBridge.ts` | Maintainer | not-run |
| Google account/file picker flows | `apps/daemon/src/google-account-service.ts`, `packages/agent-core/src/common/types/task.ts` | Maintainer | not-run |

## Local-Only Workflows

| Item | Source File(s) | Validation Owner | Parity Status |
|------|----------------|------------------|---------------|
| Clean-start local task/session deletion | `apps/daemon/src/app-setup.ts`, `apps/daemon/src/storage-service.ts` | Maintainer | not-run |
| Local workspace and filesystem task context | `apps/daemon/src/workspace-service.ts`, `packages/agent-core/src/common/types/workspace.ts` | Maintainer | not-run |

## Inventory Completion Rule

Before T097/T098 can pass, each item must be expanded to concrete provider/model/tool/MCP/connector entries with `pass`, `approved-exclusion`, `approved-gap`, or `failed` status and a matching evidence entry in `validation-evidence.md`.
