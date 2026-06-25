# Implementation Plan Design: MyBotTeam v0.5.0

## 1. Overview

**Goal:** Step-by-step implementation plan for MyBotTeam v0.5.0 — a local-first AI Agent Harness desktop app. Starting from scratch, cherry-picking mature patterns from previous versions and reference projects.

**Approach:** Strict bottom-up (architecture-layer milestones). Each ticket includes a cherry-pick investigation section to identify what to reuse from source projects.

**Source Priority Order:** v0.2.0 → v0.3.0 → Accomplish → v0.4.0

**Reference Projects:**
- **OpenClaw** — Agent harness, skill workshop, cron system
- **Accomplish** — Electron/React/daemon architecture, CompletionEnforcer
- **Odysseus** — File system tools, memory system, document editing, scheduler

## 2. Milestone Structure (12 Milestones)

| # | Name | Scope | Ticket Count |
|---|------|-------|-------------|
| M1 | Foundation | Monorepo, build, config, shared types | 5 |
| M2 | Data Layer | SQLite, vault, migrations, PID lock | 5 |
| M3 | IPC & Daemon | JSON-RPC, Unix socket, lifecycle | 5 |
| M4 | LLM Layer | Providers, BYOK, model router, custom provider | 5 |
| M5 | Agent Runtime | Eve, materializer, orchestrator, state machine | 5 |
| M6 | Verification & Safety | CompletionEnforcer, HITL, watchdog | 4 |
| M7 | MCP & Tools | MCP servers, filesystem, tool tiers | 5 |
| M8 | Knowledge System | Skills, memory, standing orders | 4 |
| M9 | Productivity Tools | Scheduler, document editor, notes | 3 |
| M10 | Specialized Agents | Secretary, Accountant, agent profiles | 3 |
| M11 | Desktop & UI | Electron shell, React UI, settings | 5 |
| M12 | Logging & Debug | Pino logging, debug logs, tool audit | 3 |
| **Total** | | | **57** |

## 3. Ticket Format

```markdown
### TICKET-[M#]-[序号]: [Title]

**Milestone:** M# — [Milestone Name]
**PRD Requirements:** REQ-XXX, REQ-YYY
**Effort:** S | M | L | XL
**Blocked By:** [ticket IDs]
**Blocking:** [ticket IDs]
**Source References:**
- Primary: [source project/version]
- Secondary: [other source]

**Cherry-Pick Investigation:**
- What to look for in [source]: [specific module/file]
- What to reuse vs. rewrite: [guidance]
- Known differences: [caveats]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Test Requirements:**
- Unit: [scope]
- Contract: [if applicable]
```

## 4. Full Ticket Breakdown

### M1: Foundation (5 tickets)

#### TICKET M1-1: pnpm workspace + monorepo scaffold
- **Effort:** S
- **Blocked By:** —
- **Blocking:** M1-2, M1-3, M1-4, M1-5
- **Source:** v0.2.0 (pnpm-workspace.yaml, root package.json)
- **Cherry-Pick:** Copy pnpm-workspace.yaml from v0.2.0 — defines apps/*, packages/*, packages/mcp-servers/* with onlyBuiltDependencies. Adapt package.json scripts from v0.2.0 root. No code reuse — structural only.
- **Acceptance Criteria:**
  - [ ] pnpm-workspace.yaml defines apps/*, packages/*, packages/mcp-servers/*
  - [ ] Root package.json with build/dev/check/test scripts
  - [ ] .npmrc with use-node-version=24
  - [ ] apps/ and packages/ directories exist
- **Tests:** N/A (scaffold only)

#### TICKET M1-2: tsconfig.base.json + TypeScript config
- **Effort:** S
- **Blocked By:** M1-1
- **Blocking:** M1-4, M2-1, M3-1
- **Source:** v0.2.0 (tsconfig.base.json)
- **Cherry-Pick:** Copy tsconfig.base.json from v0.2.0. ES2022 target, ESNext module, bundler resolution, strict mode, declaration+sourceMap. Add path aliases for @myboteam/*.
- **Acceptance Criteria:**
  - [ ] tsconfig.base.json with ES2022, NodeNext, strict
  - [ ] Path aliases for @myboteam/agent-core, @myboteam/types
  - [ ] tsconfig.json with project references
- **Tests:** N/A (config only)

#### TICKET M1-3: Biome linting + formatting
- **Effort:** S
- **Blocked By:** M1-1
- **Blocking:** —
- **Source:** v0.2.0 (biome.json)
- **Cherry-Pick:** Copy biome.json from v0.2.0. Lint + format rules. Add to root package.json scripts.
- **Acceptance Criteria:**
  - [ ] biome.json configured for lint + format
  - [ ] `pnpm check` runs biome across workspace
  - [ ] No lint errors on empty project
- **Tests:** N/A (tooling only)

#### TICKET M1-4: Shared types package (@myboteam/types)
- **Effort:** M
- **Blocked By:** M1-1, M1-2
- **Blocking:** M2-1, M3-1, M4-1, M5-1, M7-1
- **Source:** v0.2.0 (packages/types/src/)
- **Cherry-Pick:** Copy type definitions from v0.2.0 packages/types/src/ — comprehensive Zod schemas for AgentConfig, Provider, MCPConfig, VaultEntry, RpcMethod, SkillRecord, DaemonEvent, AgentProcess, Result<T,E>. Adapt for v0.5.0 AD.md entities. v0.2.0 has 13+ type files with branded types and discriminated unions.
- **Acceptance Criteria:**
  - [ ] packages/types/src/ with all entity types
  - [ ] Zod schemas for validation
  - [ ] Exports from packages/types/src/index.ts
  - [ ] TypeScript compiles with no errors
- **Tests:** Unit tests for Zod schema validation

#### TICKET M1-5: Dev scripts (dev orchestrator, build, check)
- **Effort:** M
- **Blocked By:** M1-1
- **Blocking:** —
- **Source:** v0.2.0 (scripts/dev.mjs)
- **Cherry-Pick:** Copy dev.mjs from v0.2.0. Concurrent daemon+web+desktop startup, graceful shutdown. Adapt for v0.5.0 package structure.
- **Acceptance Criteria:**
  - [ ] scripts/dev.mjs starts daemon + web + desktop concurrently
  - [ ] Auto-discovers available ports
  - [ ] Graceful shutdown on SIGINT/SIGTERM
  - [ ] `pnpm dev` works end-to-end
- **Tests:** N/A (scripts)

---

### M2: Data Layer (5 tickets)

#### TICKET M2-1: SQLite storage layer (better-sqlite3, WAL)
- **Effort:** L
- **Blocked By:** M1-2, M1-4
- **Blocking:** M2-2, M2-3, M5-1, M8-1
- **Source:** v0.2.0 (packages/daemon/src/database-service.ts, migrations/)
- **Cherry-Pick:** Copy DatabaseService class from v0.2.0 daemon. sql.js with filesystem persistence and checkpoint every 30s. Adapt schema for v0.5.0 AD.md entities. v0.2.0 has 12 migration files (001-initial through 012-skills-protected) — use as migration pattern reference. Add default seeding (orchestrator, secretary agents).
- **Acceptance Criteria:**
  - [ ] AgentStorage class with CRUD for all entities
  - [ ] WAL mode enabled
  - [ ] Schema matches AD.md ER diagram
  - [ ] Default agent seeding on first run
- **Tests:** Unit tests for each CRUD operation

#### TICKET M2-2: Schema migrations manager
- **Effort:** M
- **Blocked By:** M2-1
- **Blocking:** M8-1, M9-1
- **Source:** v0.2.0 (packages/daemon/src/migrations/)
- **Cherry-Pick:** Extract migration pattern from v0.2.0 — Migration interface (version, name, up function), 12 sequential migration files with version tracking. Adapt for v0.5.0 schema.
- **Acceptance Criteria:**
  - [ ] Migration table tracks applied versions
  - [ ] Up migrations run on startup
  - [ ] Down migrations available for rollback
  - [ ] Idempotent — safe to run multiple times
- **Tests:** Unit tests for migration apply/rollback

#### TICKET M2-3: Encrypted secrets vault (AES-256-GCM)
- **Effort:** L
- **Blocked By:** M2-1
- **Blocking:** M4-4, M3-1
- **Source:** v0.2.0 (packages/daemon/src/vault/) — most mature vault implementation
- **Cherry-Pick:** AES-256-GCM encryption from v0.2.0 VaultCrypto. PBKDF2 key derivation (100k iterations, sha512) with derived key caching. VaultService with DB-backed storage, per-key mutex, TTL cache. VaultKeyProvider interface (EnvKeyProvider + KeychainKeyProvider). Custom error hierarchy. Atomic writes. Adapt for v0.5.0 vault table schema.
- **Acceptance Criteria:**
  - [ ] API keys stored encrypted at rest
  - [ ] Decrypted in-memory only at materialization
  - [ ] PBKDF2 with 100k iterations
  - [ ] Recovery flow for key loss
  - [ ] OAuth token auto-refresh support
- **Tests:** Unit tests for encrypt/decrypt, key derivation, recovery

#### TICKET M2-4: PID lock manager
- **Effort:** S
- **Blocked By:** M2-1
- **Blocking:** M3-2, M3-3
- **Source:** v0.2.0 (packages/daemon/src/pid-lock.ts)
- **Cherry-Pick:** Copy PID lock implementation from v0.2.0 daemon. File-based PID lock with stale detection. Cross-platform path handling.
- **Acceptance Criteria:**
  - [ ] PID lock file created on daemon start
  - [ ] Stale lock detected and recovered
  - [ ] Lock released on graceful shutdown
  - [ ] Concurrent daemon instances prevented
- **Tests:** Unit tests for lock/unlock/stale detection

#### TICKET M2-5: Data directory manager
- **Effort:** S
- **Blocked By:** M1-1
- **Blocking:** M2-1, M2-3
- **Source:** v0.2.0 (packages/daemon/src/socket-path.ts)
- **Cherry-Pick:** Data directory pattern from v0.2.0 PathResolver — getDataDir() resolves ~/.myboteam or MYBOTEAM_DATA_DIR env. Also provides getSkillsDir(), getSocketPath() (Unix socket or Windows named pipe with SHA-256 hash). Create subdirs: data/, logs/, vault/.
- **Acceptance Criteria:**
  - [ ] Default data dir at ~/.myboteam/
  - [ ] Configurable via MYBOTEAM_DATA_DIR env
  - [ ] Subdirs created on first run
  - [ ] Cross-platform path resolution
- **Tests:** Unit tests for path resolution

---

### M3: IPC & Daemon (5 tickets)

#### TICKET M3-1: JSON-RPC server (Unix socket)
- **Effort:** L
- **Blocked By:** M1-2, M1-4, M2-3
- **Blocking:** M3-2, M3-5, M4-1
- **Source:** v0.2.0 (packages/daemon/src/rpc-server.ts, socket-transport.ts)
- **Cherry-Pick:** JSON-RPC server from v0.2.0 daemon. Unix socket transport. Request/response pattern with correlation IDs. Adapt for v0.5.0 method names.
- **Acceptance Criteria:**
  - [ ] JSON-RPC 2.0 server over Unix socket
  - [ ] Request/response with correlation IDs
  - [ ] Method routing to handler functions
  - [ ] Error responses with structured codes
- **Tests:** Contract tests for RPC methods

#### TICKET M3-2: Daemon lifecycle (start/stop/graceful shutdown)
- **Effort:** M
- **Blocked By:** M2-4, M3-1
- **Blocking:** M3-3, M3-4, M5-5
- **Source:** v0.2.0 (packages/daemon/src/index.ts, daemon-core.ts), v0.3.0 (apps/desktop/src/main/daemon-bootstrap.ts)
- **Cherry-Pick:** Daemon lifecycle from v0.2.0 — DaemonCore class with service registry (init/start/stop lifecycle), health tracking, agent locks, task queue with concurrency limit. Forked child process management. Graceful drain with configurable timeout from v0.3.0 daemon-bootstrap.
- **Acceptance Criteria:**
  - [ ] Daemon starts as child process
  - [ ] Graceful shutdown drains active tasks (30s timeout)
  - [ ] Daemon survives Electron window close
  - [ ] Clean resource cleanup on shutdown
- **Tests:** Integration tests for start/stop lifecycle

#### TICKET M3-3: Crash recovery (PID detection, stale tasks)
- **Effort:** M
- **Blocked By:** M2-4, M3-2
- **Blocking:** —
- **Source:** v0.3.0 (apps/daemon/src/app-setup.ts lines 49-53)
- **Cherry-Pick:** Crash recovery from v0.3.0 — iterates all tasks on startup, marks any `running` tasks as `failed`. PID lock detection from v0.2.0 pid-lock.ts. Auto-restart attempted after crash.
- **Acceptance Criteria:**
  - [ ] Stale PID detected on startup
  - [ ] Stale running tasks marked as failed
  - [ ] Auto-restart attempted after crash
  - [ ] Crash logged with timestamp
- **Tests:** Unit tests for stale detection, integration for recovery flow

#### TICKET M3-4: Login-item auto-start
- **Effort:** M
- **Blocked By:** M3-2
- **Blocking:** —
- **Source:** v0.3.0 (apps/desktop/src/main/daemon/service-manager*.ts)
- **Cherry-Pick:** Cross-platform auto-start from v0.3.0 — service-manager.ts orchestrates platform branching. macOS: LaunchAgent plist + launchctl load/unload. Linux: systemd service. Windows: login-item. Opt-in via settings UI.
- **Acceptance Criteria:**
  - [ ] macOS: LaunchAgent created
  - [ ] Windows: Startup entry created
  - [ ] Toggle in settings UI
  - [ ] Daemon starts on system boot
- **Tests:** Unit tests for login item configuration

#### TICKET M3-5: IPC bus (renderer ↔ daemon)
- **Effort:** L
- **Blocked By:** M3-1, M11-1
- **Blocking:** M11-2
- **Source:** v0.3.0 (apps/desktop/src/preload/index.ts, handlers/)
- **Cherry-Pick:** 4-link IPC chain from v0.3.0 — React UI → contextBridge → Electron Main → Daemon. Copy preload handler pattern (app-core handlers, tasks-events, workspace-files, integrations, debug-analytics). Adapt for v0.5.0 API surface.
- **Acceptance Criteria:**
  - [ ] contextBridge exposes typed API to renderer
  - [ ] 4-link chain: React → preload → main → daemon
  - [ ] Renderer has zero Node.js/filesystem access
  - [ ] Event forwarding (daemon → main → renderer)
- **Tests:** Contract tests for IPC methods

---

### M4: LLM Layer (5 tickets)

#### TICKET M4-1: ProviderClient interface
- **Effort:** M
- **Blocked By:** M3-1, M1-4
- **Blocking:** M4-2, M4-3, M4-4, M4-5
- **Source:** v0.2.0 (packages/daemon/src/conversation-provider.ts)
- **Cherry-Pick:** Unified API caller from v0.2.0 callProviderApi() — handles OpenAI and Anthropic APIs with SSE streaming, tool call extraction, model fallback (date-suffixed models → base model). Abstract interface with concrete implementations per provider.
- **Acceptance Criteria:**
  - [ ] ProviderClient interface defined
  - [ ] Methods: chatCompletion, streamChat, listModels
  - [ ] Type-safe with Zod validation
  - [ ] Error types defined
- **Tests:** Contract tests for interface

#### TICKET M4-2: OpenAI + Anthropic providers
- **Effort:** M
- **Blocked By:** M4-1
- **Blocking:** M5-5
- **Source:** v0.2.0 (packages/daemon/src/conversation-provider.ts)
- **Cherry-Pick:** OpenAI and Anthropic provider implementations from v0.2.0 callProviderApi() — unified API caller with SSE streaming, tool call extraction, model fallback. Use @anthropic-ai/sdk and openai packages.
- **Acceptance Criteria:**
  - [ ] OpenAI provider with chat completion + streaming
  - [ ] Anthropic provider with chat completion + streaming
  - [ ] Model listing from API
  - [ ] Error handling with retries
- **Tests:** Unit tests (mocked API), contract tests

#### TICKET M4-3: Local LLM provider (Ollama/LMStudio)
- **Effort:** M
- **Blocked By:** M4-1
- **Blocking:** M5-5
- **Source:** v0.3.0 (packages/agent-core/src/providers/ollama.ts, lmstudio.ts)
- **Cherry-Pick:** Ollama and LMStudio providers from v0.3.0 — connection testing, model fetching, tool support detection. HTTP-based local API calls. Auto-discovery of running instances.
- **Acceptance Criteria:**
  - [ ] Ollama provider with local API calls
  - [ ] LMStudio provider with local API calls
  - [ ] Auto-discovery of running instances
  - [ ] Zero data leaving machine
- **Tests:** Unit tests (mocked HTTP)

#### TICKET M4-4: Custom provider (URL + key + model)
- **Effort:** M
- **Blocked By:** M4-1
- **Blocking:** M5-5
- **Source:** v0.3.0 (packages/agent-core/src/providers/custom.ts)
- **Cherry-Pick:** Custom provider from v0.3.0 — testCustomConnection() tests any OpenAI-compatible endpoint by hitting /v1/models. Handles auth, timeouts, 401/403/404 gracefully. User-configurable base URL, API key, model name.
- **Acceptance Criteria:**
  - [ ] Custom provider with URL + key + model configuration
  - [ ] OpenAI-compatible API format
  - [ ] Validation of URL format and connectivity
  - [ ] Stored in vault encrypted
- **Tests:** Unit tests for config validation

#### TICKET M4-5: Model router + BYOK key injection
- **Effort:** L
- **Blocked By:** M4-2, M4-3, M4-4, M2-3
- **Blocking:** M5-5
- **Source:** v0.2.0 (packages/daemon/src/conversation-provider.ts model fallback), v0.3.0 (providers/ models.ts)
- **Cherry-Pick:** Model fallback chain from v0.2.0 callProviderApi() — date-suffixed models → base model → claude-sonnet/gpt-4o. Model catalog from v0.3.0 providers/models.ts. BYOK key injection: decrypt from vault at materialization time.
- **Acceptance Criteria:**
  - [ ] Model router selects provider based on agent config
  - [ ] Fallback chain with dead-host cooldown
  - [ ] BYOK keys injected at runtime, never logged
  - [ ] Per-agent provider override supported
- **Tests:** Unit tests for routing logic, fallback behavior

---

### M5: Agent Runtime (5 tickets)

#### TICKET M5-1: Agent configuration system
- **Effort:** M
- **Blocked By:** M1-4, M2-1
- **Blocking:** M5-2, M5-3, M5-4
- **Source:** v0.2.0 (packages/types/src/agent-config.ts, packages/daemon/src/agent-registry.ts)
- **Cherry-Pick:** Agent configuration from v0.2.0 — AgentConfigSchema with Zod (id, name, role, model, provider, params, secrets, skills, mcps), AgentRegistry with CRUD in SQLite and status transitions with validation. JSON-based agent definitions.
- **Acceptance Criteria:**
  - [ ] AgentConfig type with all fields from AD.md
  - [ ] Default agent configs (orchestrator, secretary, accountant)
  - [ ] Validation via Zod schemas
  - [ ] Loaded from SQLite on startup
- **Tests:** Unit tests for config validation

#### TICKET M5-2: Eve materializer (runtime file generation)
- **Effort:** L
- **Blocked By:** M5-1
- **Blocking:** M5-3, M5-5
- **Source:** v0.3.0 (packages/agent-core/src/opencode/config-builder.ts)
- **Cherry-Pick:** Config builder from v0.3.0 — builds runtime config from agent state. Generates deterministic runtime files from agent config. Injects agent profile, tool catalog, delegation policy into instructions.
- **Acceptance Criteria:**
  - [ ] Materializer generates runtime files from config
  - [ ] Agent profile injected into instructions
  - [ ] Tool catalog filtered per agent
  - [ ] Delegation policy included
- **Tests:** Unit tests for materialization output

#### TICKET M5-3: Agent state machine
- **Effort:** M
- **Blocked By:** M5-1
- **Blocking:** M5-5, M6-1
- **Source:** v0.2.0 (packages/agent/src/state/AgentStateMachine.ts)
- **Cherry-Pick:** AgentStateMachine from v0.2.0 — states: idle, loading, running, stopping, crashed. Transition validation with listener callbacks. Permanent crash marking. Event emission on state changes.
- **Acceptance Criteria:**
  - [ ] States: idle, running, paused, completed, failed
  - [ ] Valid transitions enforced
  - [ ] Events emitted on transitions
  - [ ] Persisted to SQLite
- **Tests:** Unit tests for all transitions

#### TICKET M5-4: Deterministic router (intent → agent)
- **Effort:** L
- **Blocked By:** M5-1, M4-5
- **Blocking:** M5-5
- **Source:** v0.2.0 (apps/desktop/src/main/orchestrator/semantic-matcher.ts)
- **Cherry-Pick:** Routing logic from v0.2.0 SemanticMatcher — LLM-based worker matching with capability-based fallback. Maps user intent to appropriate agent. Handles ambiguous intent with clarification.
- **Acceptance Criteria:**
  - [ ] Intent analysis via LLM
  - [ ] Maps to correct agent (secretary, accountant, orchestrator)
  - [ ] Handles ambiguous intent with clarification
  - [ ] Deterministic for same input
- **Tests:** Unit tests for routing decisions

#### TICKET M5-5: Orchestrator (plan + delegation)
- **Effort:** XL
- **Blocked By:** M5-2, M5-3, M5-4, M4-5
- **Blocking:** M6-1, M7-1
- **Source:** v0.2.0 (apps/desktop/src/main/orchestrator/)
- **Cherry-Pick:** OrchestratorAgent from v0.2.0 — task delegation, cancellation, retry, timeout handling, worker registry integration, task store persistence, notification bus events. WorkerRegistry with heartbeat tracking and stale worker pruning. TaskQueue for FIFO pending tasks. TimerManager for per-correlationId timeout management.
- **Acceptance Criteria:**
  - [ ] Accepts NL input from chat
  - [ ] Creates execution plan via LLM
  - [ ] Delegates to appropriate agents
  - [ ] Supports sequential and parallel execution
  - [ ] Logs all plans and outcomes to SQLite
- **Tests:** Integration tests for plan creation and delegation

---

### M6: Verification & Safety (4 tickets)

#### TICKET M6-1: CompletionEnforcer state machine
- **Effort:** L
- **Blocked By:** M5-3, M5-5
- **Blocking:** M6-2, M10-1, M10-2
- **Source:** v0.3.0 (packages/agent-core/src/opencode/completion/completion-enforcer.ts)
- **Cherry-Pick:** CompletionEnforcer from v0.3.0 — handles complete_task detection, step finish, process exit, continuation logic, todo-aware completion. 211 lines. State machine with CompletionState and CompletionFlowState. Continuation prompt templates.
- **Acceptance Criteria:**
  - [ ] 6-state machine implemented
  - [ ] Detects exit without complete_task → continuation
  - [ ] Partial completion (todos remaining) → partial continuation
  - [ ] Max retries enforced (configurable, default 10)
  - [ ] State persisted to SQLite
- **Tests:** Unit tests for all state transitions

#### TICKET M6-2: TaskInactivityWatchdog
- **Effort:** M
- **Blocked By:** M6-1
- **Blocking:** —
- **Source:** v0.3.0 (packages/agent-core/src/internal/classes/TaskInactivityWatchdog.ts)
- **Cherry-Pick:** TaskInactivityWatchdog from v0.3.0 — soft timeout (90s) → nudge. Hard timeout (90s + 60s grace = 150s) → fail. Configurable timeouts.
- **Acceptance Criteria:**
  - [ ] Soft timeout at 90s (configurable)
  - [ ] Hard timeout at 150s (90s + 60s grace)
  - [ ] Task marked failed on hard timeout
  - [ ] Continuation nudge on soft timeout
- **Tests:** Unit tests for timeout behavior

#### TICKET M6-3: HITL manager (approval boundaries)
- **Effort:** L
- **Blocked By:** M3-5
- **Blocking:** M10-1, M10-2, M6-4
- **Source:** v0.3.0 (packages/agent-core/src/services/permission-handler.ts)
- **Cherry-Pick:** PermissionRequestHandler from v0.3.0 — create/resolve permission and question requests with timeouts. Permission types for file operations, questions. Factory function for dependency injection.
- **Acceptance Criteria:**
  - [ ] Pauses on sensitive actions (email, external API, file outside workspace)
  - [ ] Desktop notification sent
  - [ ] UI prompt with approve/modify/reject
  - [ ] Execution resumes after user input
- **Tests:** Unit tests for boundary detection, integration for pause/resume

#### TICKET M6-4: Desktop notification integration
- **Effort:** M
- **Blocked By:** M6-3, M11-1
- **Blocking:** —
- **Source:** v0.2.0 (apps/desktop/src/main/services/notification-bus.ts)
- **Cherry-Pick:** NotificationBus from v0.2.0 — pub/sub event bus for StatusEvent and StreamEvent, subscribe/publish pattern. Electron Notification API for desktop notifications. Notification permissions handling.
- **Acceptance Criteria:**
  - [ ] Desktop notifications for HITL prompts
  - [ ] Notifications for task completion
  - [ ] Notification click opens relevant view
  - [ ] Respect system notification settings
- **Tests:** Unit tests for notification triggers

---

### M7: MCP & Tools (5 tickets)

#### TICKET M7-1: MCP server manager (process lifecycle)
- **Effort:** L
- **Blocked By:** M5-5, M3-1
- **Blocking:** M7-2, M7-3
- **Source:** v0.2.0 (packages/daemon/src/mcp/) — most mature MCP implementation
- **Cherry-Pick:** McpManager from v0.2.0 — spawns/kills MCP server processes, health monitoring (30s interval), auto-restart with exponential backoff (max 3 retries). McpRegistryService with SQLite CRUD for 11 predefined servers. McpToolProxy with queued tool calls per server (serialized for stdio). McpToolInjector with 60s TTL caching.
- **Acceptance Criteria:**
  - [ ] MCP servers managed as child processes
  - [ ] stdio transport with JSON-RPC
  - [ ] Auto-reconnect on crash
  - [ ] Tool discovery from server manifests
- **Tests:** Integration tests for MCP lifecycle

#### TICKET M7-2: Filesystem tools (read/write/edit/glob/grep/ls)
- **Effort:** L
- **Blocked By:** M7-1, M2-1
- **Blocking:** M7-3, M9-2
- **Source:** v0.2.0 (packages/mcp-servers/) — 11 bundled MCP servers
- **Cherry-Pick:** Filesystem MCP server from v0.2.0 — read_file, write_file, list_directory, create_directory, copy_path, move_path, delete_path, stat_path. 11 bundled servers: get-local-time, start-task, complete-task, file-permission, ask-user-question, dev-browser-mcp, wait-for-login, safe-file-deletion, gws-mcp, gmail-mcp, calendar-mcp. Add edit (FIND/REPLACE) and glob/grep from AD.md requirements.
- **Acceptance Criteria:**
  - [ ] read with offset/limit
  - [ ] write with parent dir creation + diff output
  - [ ] edit with FIND/REPLACE + uniqueness check
  - [ ] glob and grep with .gitignore patterns
  - [ ] ls with include/exclude patterns
  - [ ] All confined to workspace root
- **Tests:** Unit tests for each tool, security tests for workspace confinement

#### TICKET M7-3: 3-tier tool system (daemon-native / MCP / Eve stubs)
- **Effort:** L
- **Blocked By:** M7-1, M7-2, M5-5
- **Blocking:** M7-4
- **Source:** OpenClaw (src/tools/ availability, planner)
- **Cherry-Pick:** Tool availability system from OpenClaw — declarative allOf/anyOf combinators. Hidden-tools pattern (show disabled with reasons). Tier resolution: Tier 1 (in-process daemon), Tier 2 (MCP stdio), Tier 3 (Eve stubs).
- **Acceptance Criteria:**
  - [ ] Tier 1: daemon-native tools (in-process)
  - [ ] Tier 2: MCP server tools (stdio)
  - [ ] Tier 3: Eve tool stubs (placeholder)
  - [ ] Tool resolution by tier
- **Tests:** Unit tests for tier resolution

#### TICKET M7-4: Tool availability system (declarative)
- **Effort:** M
- **Blocked By:** M7-3
- **Blocking:** —
- **Source:** v0.3.0 (packages/agent-core/src/providers/tool-support-testing.ts)
- **Cherry-Pick:** Tool support testing from v0.3.0 — testModelToolSupport(), testOllamaModelToolSupport(), testLMStudioModelToolSupport(). Sends test chat completion with forced tool call to detect support. ToolSupportStatus type (supported/unsupported/unknown).
- **Acceptance Criteria:**
  - [ ] Declarative availability expressions
  - [ ] Evaluated against runtime context
  - [ ] Agent-specific tool filtering
  - [ ] Disabled tools shown with reasons
- **Tests:** Unit tests for availability evaluation

#### TICKET M7-5: Tool security sandboxing
- **Effort:** M
- **Blocked By:** M7-1
- **Blocking:** —
- **Source:** v0.2.0 (packages/daemon/src/skills/security-scanner.ts)
- **Cherry-Pick:** Security scanning from v0.2.0 — scanSkillContent() scans for path traversal, shell commands, encoded payloads using regex patterns. Returns ScanWarning[]. MCP server process isolation. Restricted filesystem scope per server.
- **Acceptance Criteria:**
  - [ ] Each MCP server in separate child process
  - [ ] Restricted filesystem scope per server
  - [ ] Manifest validation on registration
  - [ ] Tool call logging for audit
- **Tests:** Security tests for isolation

---

### M8: Knowledge System (4 tickets)

#### TICKET M8-1: Memory system (SQLite + extraction)
- **Effort:** L
- **Blocked By:** M2-1, M2-2
- **Blocking:** M8-2, M8-3, M8-4
- **Source:** v0.2.0 (packages/daemon/src/memory-service.ts)
- **Cherry-Pick:** MemoryService from v0.2.0 — LLM-powered memory extraction from conversations (6 categories: identity, preference, fact, contact, project, goal), periodic extraction (configurable interval), deduplication, LLM-based audit with safety guard (max 50% removal threshold), SQLite storage. createMemoryLlm() factory uses configured provider for LLM calls.
- **Acceptance Criteria:**
  - [ ] Memory entries stored in SQLite with categories
  - [ ] LLM-based extraction from conversations
  - [ ] Categories: facts, preferences, identity, events, contacts, projects, instructions
  - [ ] CRUD operations via agent tools
- **Tests:** Unit tests for storage, integration for extraction

#### TICKET M8-2: Memory retrieval (hybrid keyword + vector)
- **Effort:** L
- **Blocked By:** M8-1
- **Blocking:** —
- **Source:** Odysseus (src/chat_processor.py:159-320 hybrid retrieval)
- **Cherry-Pick:** Hybrid retrieval from Odysseus — `0.55 * vector + 0.40 * keyword + 0.05 * recency`. Category boosts (1.4x identity, 1.3x contact). Gate: vector >= 0.20 OR keyword >= 0.08. Optional ChromaDB for vector search.
- **Acceptance Criteria:**
  - [ ] Hybrid scoring: vector + keyword + recency
  - [ ] Category boosts configured
  - [ ] Gate threshold filtering
  - [ ] Optional ChromaDB integration
- **Tests:** Unit tests for scoring algorithm

#### TICKET M8-3: Skill Workshop (proposal lifecycle)
- **Effort:** L
- **Blocked By:** M8-1, M5-5
- **Blocking:** M8-4
- **Source:** v0.3.0 (packages/agent-core/src/internal/classes/SkillsManager.ts, skill-parser.ts)
- **Cherry-Pick:** SkillsManager from v0.3.0 — proposal lifecycle, skill file parsing (SKILL.md frontmatter), skill importer with validation. Security scanning from v0.2.0 security-scanner.ts. Rollback metadata.
- **Acceptance Criteria:**
  - [ ] Proposal lifecycle: create, pending, revise, apply, reject, quarantine
  - [ ] Security scan before apply
  - [ ] Rollback metadata stored
  - [ ] SKILL.md written on apply
  - [ ] User can inspect and approve/reject
- **Tests:** Unit tests for lifecycle transitions, security scan tests

#### TICKET M8-4: Standing Orders (persistent instructions)
- **Effort:** M
- **Blocked By:** M8-3
- **Blocking:** —
- **Source:** v0.3.0 (packages/agent-core/src/storage/repositories/knowledgeNotes.ts)
- **Cherry-Pick:** Knowledge notes from v0.3.0 — workspace-level knowledge storage pattern. Standing orders as workspace files. Natural-language creation from conversation ("always X"). Loaded into every session's system prompt.
- **Acceptance Criteria:**
  - [ ] Standing orders stored as workspace files
  - [ ] Natural-language creation from conversation
  - [ ] Loaded into every session context
  - [ ] Management UI for list/edit/delete
- **Tests:** Unit tests for file persistence, integration for session injection

---

### M9: Productivity Tools (3 tickets)

#### TICKET M9-1: NL Scheduler (cron/at/every)
- **Effort:** L
- **Blocked By:** M3-2, M2-2
- **Blocking:** M10-1, M10-2
- **Source:** v0.2.0 (packages/daemon/src/scheduler-service.ts, cron-utils.ts)
- **Cherry-Pick:** SchedulerService from v0.2.0 — cron-based task scheduler with minute-aligned tick, catch-up on start, CRUD (create, list, delete, setEnabled). cron-utils.ts — parseCronField() (supports *, steps, ranges), computeNextRunAt() (scans up to 4 years), validateCron(). SQLite-backed scheduled tasks.
- **Acceptance Criteria:**
  - [ ] Create schedules from NL ("check email every morning at 9")
  - [ ] Types: one-shot (at), interval (every), cron expression
  - [ ] Delivery: chat, webhook, session
  - [ ] Run history with pass/fail status
  - [ ] Management UI: list, edit, pause, remove
- **Tests:** Unit tests for cron parsing, integration for schedule execution

#### TICKET M9-2: Document Editor (FIND/REPLACE + versions)
- **Effort:** M
- **Blocked By:** M7-2
- **Blocking:** M10-1, M10-2
- **Source:** Odysseus (agent_loop.py document streaming)
- **Cherry-Pick:** Document editing from Odysseus — FIND/REPLACE surgical editing. Version history with model attribution. Suggestion mode (non-destructive). Auto-language detection.
- **Acceptance Criteria:**
  - [ ] FIND/REPLACE with uniqueness checking
  - [ ] Version history per document
  - [ ] Suggestion mode (FIND/SUGGEST/REASON)
  - [ ] Auto-detected language
- **Tests:** Unit tests for FIND/REPLACE, version tracking

#### TICKET M9-3: Notes & Todos (CRUD + reminders)
- **Effort:** M
- **Blocked By:** M2-1
- **Blocking:** M10-2
- **Source:** Odysseus (task_scheduler.py reminder pattern)
- **Cherry-Pick:** Notes system — text + checklist types. Due dates with reminders via scheduler. Pin/archive, colors, labels. Agent tools for CRUD.
- **Acceptance Criteria:**
  - [ ] Note types: text, checklist with item toggle
  - [ ] Due dates, pin/archive, colors, labels
  - [ ] Reminders via notification channels
  - [ ] Agent tools: create, read, update, search, delete
- **Tests:** Unit tests for CRUD, integration for reminders

---

### M10: Specialized Agents (3 tickets)

#### TICKET M10-1: Secretary agent (calendar/email)
- **Effort:** L
- **Blocked By:** M6-1, M9-1, M9-2
- **Blocking:** M11-2
- **Source:** v0.2.0 (packages/mcp-servers/gmail-mcp/, calendar-mcp/, packages/types/src/agent-config.ts)
- **Cherry-Pick:** Agent profile pattern from v0.2.0 AgentConfigSchema. Gmail MCP from v0.2.0 gmail-mcp package. Calendar MCP from v0.2.0 calendar-mcp package. Secretary instructions and tool assignments.
- **Acceptance Criteria:**
  - [ ] Secretary agent configured with calendar + email tools
  - [ ] Read/create/modify calendar events
  - [ ] Email requires HITL approval
  - [ ] Schedule surfacing on request
- **Tests:** Integration tests for calendar/email operations

#### TICKET M10-2: Accountant agent (invoices/expenses)
- **Effort:** L
- **Blocked By:** M6-1, M9-2, M9-3
- **Blocking:** M11-2
- **Source:** v0.2.0 (packages/mcp-servers/gws-mcp/, packages/types/src/agent-config.ts)
- **Cherry-Pick:** Agent profile from v0.2.0 AgentConfigSchema. Google Workspace MCP from v0.2.0 gws-mcp package for email scanning. Filesystem tools for invoice organization. CSV/Excel tracking.
- **Acceptance Criteria:**
  - [ ] Accountant agent configured with financial tools
  - [ ] Scan email for invoice attachments
  - [ ] Organize into ~/Finances/Invoices/{Vendor}/
  - [ ] Update expense CSV with entries
  - [ ] Flag duplicates for review
- **Tests:** Integration tests for invoice processing

#### TICKET M10-3: Agent profiles (instructions/catalog/delegation)
- **Effort:** M
- **Blocked By:** M5-1, M5-2
- **Blocking:** M10-1, M10-2
- **Source:** v0.2.0 (packages/daemon/src/agent-registry.ts, packages/types/src/agent-config.ts)
- **Cherry-Pick:** Agent registry from v0.2.0 — CRUD for agents in SQLite, status transitions with validation, filesystem reconciliation. Agent config types with instructions, tools, delegation policy. Per-agent system prompts.
- **Acceptance Criteria:**
  - [ ] Agent profiles with instructions, tools, delegation policy
  - [ ] Injected into system prompt at materialization
  - [ ] Stored in SQLite
  - [ ] Editable via settings UI
- **Tests:** Unit tests for profile injection

---

### M11: Desktop & UI (5 tickets)

#### TICKET M11-1: Electron shell (main + preload)
- **Effort:** L
- **Blocked By:** M3-2
- **Blocking:** M3-5, M6-4, M11-2
- **Source:** v0.2.0 (apps/desktop/src/main/index.ts, window.ts, tray.ts, preload/)
- **Cherry-Pick:** Electron shell from v0.2.0 — main process (single instance lock, daemon startup with retry dialog, CSP enforcement, tray creation, window creation), preload script (contextBridge with channel constants), IPC handler registration. Window config: state persistence, position clamping to multi-monitor.
- **Acceptance Criteria:**
  - [ ] Main process with window management
  - [ ] Preload bridge exposing typed API
  - [ ] System tray integration
  - [ ] CSP headers configured
  - [ ] Single-instance enforcement
- **Tests:** E2E tests for window lifecycle

#### TICKET M11-2: React UI (chat, sidebar, views)
- **Effort:** XL
- **Blocked By:** M3-5, M10-1, M10-2
- **Blocking:** M11-3, M11-4
- **Source:** v0.3.0 (apps/web/src/client/)
- **Cherry-Pick:** Full React UI from v0.3.0 — main layout with sidebar, route definitions, Zustand stores (daemonStore, taskStore, sidebarStore), component library (shadcn/ui + glass variants), styles/globals.css (Geist fonts, HSL theming, 6 color themes). Pages: Home, Execution, Conversations, Settings (providers, workspaces, skills, scheduler, about). TaskLauncher (Cmd+K). FloatingRobot animation.
- **Acceptance Criteria:**
  - [ ] Main layout with collapsible sidebar
  - [ ] Chat interface with streaming text
  - [ ] Conversations list view
  - [ ] Settings pages (providers, agents, skills, scheduler)
  - [ ] Dark/light mode + color themes
  - [ ] TaskLauncher (Cmd+K)
- **Tests:** E2E tests for critical user flows

#### TICKET M11-3: Settings UI (providers, agents)
- **Effort:** M
- **Blocked By:** M11-2, M4-4
- **Blocking:** —
- **Source:** v0.3.0 (apps/web/src/client/pages/settings/)
- **Cherry-Pick:** Settings pages from v0.3.0 — ProvidersPage (provider grid, API key input, model selector, custom provider inputs), SkillsPage, SchedulerPage. Adapt for v0.5.0 agent management.
- **Acceptance Criteria:**
  - [ ] Provider configuration (add/edit/delete API keys)
  - [ ] Agent management (view/edit agent configs)
  - [ ] Model selection per agent
  - [ ] Custom provider setup (URL + key + model)
- **Tests:** E2E tests for settings flows

#### TICKET M11-4: Notification system (HITL, alerts)
- **Effort:** M
- **Blocked By:** M11-2, M6-4
- **Blocking:** —
- **Source:** v0.3.0 (apps/web/src/client/components/common/)
- **Cherry-Pick:** Notification components from v0.3.0 — DaemonConnectionToast, AuthErrorToast, StatusIcon, ActionChip. Adapt for HITL prompts and task alerts.
- **Acceptance Criteria:**
  - [ ] HITL approval prompts in UI
  - [ ] Task completion notifications
  - [ ] Error alerts with details
  - [ ] Toast notifications for non-critical events
- **Tests:** Unit tests for notification triggers

#### TICKET M11-5: Storybook setup
- **Effort:** M
- **Blocked By:** M11-2
- **Blocking:** —
- **Source:** v0.3.0 (apps/web/src/client/components/ui/)
- **Cherry-Pick:** Component library from v0.3.0 — 30+ shadcn/ui components (button, card, badge, dialog, input, tabs, switch, etc.) + 16 glass variants. Set up Storybook for component development and visual testing.
- **Acceptance Criteria:**
  - [ ] Storybook configured for web app
  - [ ] Stories for all UI components
  - [ ] Glass variant stories
  - [ ] Visual regression testing baseline
- **Tests:** Visual regression tests via Storybook

---

### M12: Logging & Debug (3 tickets)

#### TICKET M12-1: Pino structured logging system
- **Effort:** M
- **Blocked By:** M1-1
- **Blocking:** M12-2, M12-3
- **Source:** v0.2.0 (packages/daemon/src/logger.ts, apps/desktop/src/main/logger.ts)
- **Cherry-Pick:** Pino setup from v0.2.0 — daemon logger with singleton pattern, init(level), get(), setLevel(). Desktop logger with dual-output (file stream + stdout multistream), log directory creation, graceful degradation on file stream failure. Env-configurable LOG_LEVEL. Named child loggers.
- **Acceptance Criteria:**
  - [ ] Dual-output: file + stdout (dev only)
  - [ ] Named child loggers per module
  - [ ] Env-configurable LOG_LEVEL
  - [ ] Structured JSON format
  - [ ] Graceful degradation on file errors
- **Tests:** Unit tests for logger configuration

#### TICKET M12-2: Debug log storage + UI viewer
- **Effort:** M
- **Blocked By:** M12-1, M2-1
- **Blocking:** M12-3
- **Source:** v0.5.0 AD.md (debug_logs table spec), v0.3.0 (ExecutionPage DebugPanel)
- **Cherry-Pick:** Debug logs table from AD.md spec — append-only, rotated (30 days), with level/source/direction columns. DebugPanel UI from v0.3.0 ExecutionPage — collapsible log viewer.
- **Acceptance Criteria:**
  - [ ] debug_logs SQLite table with rotation
  - [ ] Log entries with level, source, direction, content
  - [ ] Debug panel in execution view
  - [ ] Filtering by level and source
- **Tests:** Unit tests for log storage, E2E for debug panel

#### TICKET M12-3: Tool call audit trail
- **Effort:** M
- **Blocked By:** M12-1, M2-1
- **Blocking:** —
- **Source:** v0.5.0 AD.md (tool_calls table spec)
- **Cherry-Pick:** Tool call audit from AD.md spec — separate table for all tool invocations with params, result, status, duration. Indefinite retention for audit.
- **Acceptance Criteria:**
  - [ ] tool_calls SQLite table
  - [ ] Records: tool name, params, result, status, duration
  - [ ] Queryable by agent, tool, time range
  - [ ] Indefinite retention (no rotation)
- **Tests:** Unit tests for audit recording

---

## 5. Dependency Graph (Critical Path)

```
M1-1 → M1-2 → M1-4 → M2-1 → M2-2 → M8-1 → M8-2
                ↓              ↓       ↓
              M2-3 → M4-4    M2-4 → M3-1 → M3-2 → M3-3
                ↓              ↓       ↓       ↓
              M4-5 → M5-4 → M5-5 → M6-1 → M6-2
                                    ↓       ↓
                                  M10-1   M10-2
                                    ↓       ↓
                                  M11-2 → M11-3
```

**Critical Path:** M1-1 → M1-2 → M1-4 → M2-1 → M3-1 → M3-2 → M5-5 → M6-1 → M10-1/10-2 → M11-2

**Estimated Duration:** 12-16 weeks (assuming 1 developer, full-time)

## 6. Effort Summary

| Effort | Count | Tickets |
|--------|-------|---------|
| S | 7 | M1-1, M1-2, M1-3, M2-4, M2-5 |
| M | 18 | M1-4, M1-5, M2-2, M3-4, M4-1, M4-2, M4-3, M4-4, M5-1, M5-3, M6-2, M6-4, M7-4, M7-5, M8-4, M9-2, M9-3, M10-3, M11-3, M11-4, M11-5, M12-1, M12-2, M12-3 |
| L | 20 | M2-1, M2-3, M3-1, M3-5, M4-5, M5-2, M5-4, M6-1, M6-3, M7-1, M7-2, M7-3, M8-1, M8-2, M8-3, M9-1, M10-1, M10-2, M11-1 |
| XL | 2 | M5-5, M11-2 |

**Total estimated effort:** ~220 story points (S=1, M=3, L=5, XL=8)
