# Feature Specification: SQLite Storage Layer (better-sqlite3, WAL)

**Feature Branch**: `003-sqlite-storage-layer`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "M2-1: SQLite storage layer (better-sqlite3, WAL) for MyBoteam V0.5.0"

**Demo Sentence**: After this feature, the daemon can persist agent configs, tasks, conversations, memory, notes, schedules, and MCP assignments to SQLite with WAL mode — all CRUD operations functional with typed error handling and structured logging.

## Mission Brief

**Goal**: Implement a local-first SQLite storage layer using better-sqlite3 with WAL mode, providing CRUD operations for all application entities and a migration/seeding system.

**Success Criteria**:
- AgentStorage class provides CRUD for all 11 entities defined in AD.md
- better-sqlite3 operates in WAL mode for concurrent read performance
- Database schema matches the AD.md ER diagram exactly
- All prior migrations are consolidated into a single initialization migration
- Seeding mechanism supports development, testing, and production bootstrapping (agents, tools, default data)

**Constraints**:
- Milestone M2 — Data Layer
- Effort: L (Large)
- Blocked by: M1-2 (pnpm workspace), M1-4 (TypeScript config)
- Blocks: M2-2, M2-3, M5-1, M8-1
- Source reference: v0.2.0 (packages/daemon/src/database-service.ts) — migrate from sql.js with filesystem persistence to better-sqlite3 native WAL
- Source reference: v0.2.0 (packages/daemon/src/migrations/*.ts) — consolidate 12 migrations into single init migration

## Out of Scope

- Encrypted secrets vault (AES-256-GCM) — separate feature
- FTS5 full-text indexing — separate feature
- ChromaDB vector search integration — separate feature
- PID lock manager — separate feature
- Data directory manager — separate feature
- UI or daemon integration — storage layer only

## Boundary Map

### Produces

| Artifact | Type | Exports |
|----------|------|---------|
| AgentStorage class | API | CRUD methods for all 11 entities (create, read, update, delete, query) |
| Schema types | TypeScript types | Entity interfaces, status enums, query filter types |
| Error classes | API | DatabaseError, NotFoundError, ValidationError |
| Migration system | API | initDatabase(), runMigrations() functions |
| Seeder API | API | seedDev(), seedTest(), seedProduction() functions |

### Consumes

| From Feature | Artifact | Imports |
|--------------|----------|---------|
| M2-5 Data Directory Manager | Database file path | `{data_dir}/data/` path resolution, MYBOTEAM_DATA_DIR env |
| M1-4 TypeScript Config | TypeScript compilation | Shared types from packages/agent-core |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Database with Schema (Priority: P1)

As a developer building the MyBoteam daemon, I need the storage layer to create and initialize a SQLite database with the correct schema so that all application entities are available for CRUD operations.

**Why this priority**: Without a properly initialized database, no data operations can occur. This is the foundation for all subsequent data layer features.

**Independent Test**: Can be fully tested by instantiating the storage class and verifying all 11 tables exist with correct columns and constraints.

**Acceptance Scenarios**:

1. **Given** a new database path, **When** the storage layer is initialized, **Then** a SQLite database file is created with WAL mode enabled
2. **Given** an initialized database, **When** inspecting the schema, **Then** all 11 tables exist: agent, task, task_todo, message, memory_entry, mcp_server, agent_mcp_assignment, conversation, note, schedule, document_version
3. **Given** the schema is applied, **When** checking table definitions, **Then** all columns match the AD.md ER diagram types and constraints
4. **Given** the database is initialized, **When** checking WAL mode, **Then** the journal mode is set to WAL

---

### User Story 2 - CRUD Operations for Agents (Priority: P1)

As a developer, I need to create, read, update, and delete agent records so that the system can manage agent configurations and state.

**Why this priority**: Agents are the core entity — all tasks, conversations, and memory entries reference agents. CRUD must work before any other entity operations.

**Independent Test**: Can be tested by performing all CRUD operations on agent records and verifying data integrity.

**Acceptance Scenarios**:

1. **Given** an initialized database, **When** creating an agent with slug, provider, and model, **Then** the agent is persisted with a generated UUID and returned
2. **Given** an existing agent, **When** querying by UUID, **Then** the correct agent record is returned
3. **Given** an existing agent, **When** updating the model field, **Then** the change is persisted
4. **Given** an existing agent, **When** deleting by UUID, **Then** the agent record is removed and cascading references are handled

---

### User Story 3 - CRUD Operations for Tasks and TaskTodos (Priority: P1)

As a developer, I need to manage task records and their associated todo items so that the agent runtime can track work progress and validation steps.

**Why this priority**: Tasks are the primary unit of work — agents execute tasks, and task todos validate completion. This must work alongside agent CRUD.

**Independent Test**: Can be tested by creating tasks with todos, verifying foreign key relationships, and testing cascade behavior.

**Acceptance Scenarios**:

1. **Given** an existing agent, **When** creating a task with status "pending", **Then** the task is linked to the agent via agent_id
2. **Given** an existing task, **When** adding task todos, **Then** each todo is linked to the task and has a description and completion status
3. **Given** a task with todos, **When** updating task status to "completed", **Then** the task status changes while todos remain intact
4. **Given** a task, **When** querying with filters (status, agent_id), **Then** matching tasks are returned

---

### User Story 4 - Conversations and Messages (Priority: P2)

As a developer, I need to store conversation threads and their messages so that the agent runtime can maintain context across interactions.

**Why this priority**: Conversations enable agent memory and context. This is needed for the agent runtime but can be built after core task management.

**Independent Test**: Can be tested by creating conversations with messages and verifying the relationship and ordering.

**Acceptance Scenarios**:

1. **Given** an existing agent, **When** creating a conversation with a title, **Then** the conversation is linked to the agent
2. **Given** an existing conversation, **When** adding messages with role and content, **Then** messages are persisted in order
3. **Given** a conversation with messages, **When** querying messages, **Then** they are returned sorted by creation time

---

### User Story 5 - Memory, Notes, and Schedules (Priority: P2)

As a developer, I need to store agent memory entries, notes, and scheduled tasks so that agents can retain knowledge and manage recurring work.

**Why this priority**: These entities support agent intelligence and productivity. They are needed for the full data layer but are secondary to core task management.

**Independent Test**: Can be tested by creating and querying each entity type independently.

**Acceptance Scenarios**:

1. **Given** an initialized database, **When** creating a memory entry with category and content, **Then** it is persisted and retrievable
2. **Given** an initialized database, **When** creating a note with type "checklist" and items, **Then** the note is stored with its items as JSON
3. **Given** an initialized database, **When** creating a schedule with type "cron" and expression, **Then** the schedule is persisted with status "active"

---

### User Story 6 - MCP Server Assignments (Priority: P2)

As a developer, I need to manage MCP server records and their agent assignments so that the tool system can track which agents have access to which MCP servers.

**Why this priority**: MCP server assignments control tool access. This is needed before agents can use tools.

**Independent Test**: Can be tested by creating MCP servers, assigning them to agents, and verifying the join table.

**Acceptance Scenarios**:

1. **Given** an initialized database, **When** creating an MCP server with name and status, **Then** the server is persisted
2. **Given** existing agent and MCP server, **When** creating an assignment, **Then** the agent_mcp_assignments record links them
3. **Given** an agent with assignments, **When** querying assigned MCP servers, **Then** all linked servers are returned

---

### User Story 7 - Database Migration System (Priority: P2)

As a developer, I need a migration system that applies schema changes in order so that the database schema can evolve without data loss.

**Why this priority**: Migrations ensure schema consistency across environments. All prior v0.2.0 migrations must be consolidated into a single init migration.

**Independent Test**: Can be tested by initializing a fresh database and verifying the schema matches the expected final state.

**Acceptance Scenarios**:

1. **Given** a new database, **When** running migrations, **Then** the schema is created from the consolidated init migration
2. **Given** an existing database with the correct schema, **When** running migrations, **Then** no changes are applied (idempotent)
3. **Given** the migration system, **When** inspecting the migrations table, **Then** only the consolidated init migration is recorded

---

### User Story 8 - Database Seeding Mechanism (Priority: P3)

As a developer, I need a seeding mechanism that populates the database with sample data for development and testing, and bootstraps default agents, tools, and configuration in production so that the system is ready to use out of the box.

**Why this priority**: Seeding is useful for development but not required for the storage layer to function. Can be added after core CRUD is working. Production bootstrapping ensures first-run experience includes configured agents and tools.

**Independent Test**: Can be tested by running the seeder and verifying expected records exist in both dev and production modes.

**Acceptance Scenarios**:

1. **Given** an initialized database, **When** running the seeder in dev mode, **Then** sample agents, tasks, and conversations are created
2. **Given** an initialized database, **When** running the seeder in production mode, **Then** default agents (secretary, accountant) are bootstrapped
3. **Given** a seeded database, **When** querying agents, **Then** at least one agent with valid configuration exists
4. **Given** the seeder, **When** run multiple times, **Then** it does not create duplicate records (idempotent)

---

### Edge Cases

- What happens when the database file already exists? The storage layer MUST open the existing database without re-initializing the schema.
- What happens when a foreign key reference is deleted? The system MUST handle cascade or restrict behavior as defined in the schema.
- What happens when the database file path is invalid? The system MUST fail fast with a clear error message indicating the path issue.
- What happens when WAL mode cannot be enabled? The system MUST fail fast with a clear error message.
- What happens when a migration fails mid-execution? The system MUST roll back to the previous consistent state.
- What happens when the seeder encounters a duplicate record? The system MUST skip the duplicate and continue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an AgentStorage class that exposes CRUD operations for all entities
- **FR-002**: System MUST use better-sqlite3 as the SQLite driver
- **FR-003**: System MUST enable WAL (Write-Ahead Logging) mode on database initialization
- **FR-004**: System MUST create a database schema matching the AD.md ER diagram with 11 tables
- **FR-005**: System MUST generate UUIDs for all primary key fields
- **FR-006**: System MUST enforce foreign key constraints between related entities
- **FR-007**: System MUST consolidate all prior migrations into a single initialization migration
- **FR-008**: System MUST provide a seeding mechanism that supports dev/test sample data and production bootstrapping of default agents and tools
- **FR-009**: System MUST handle database initialization idempotently (safe to call multiple times)
- **FR-010**: System MUST persist timestamp fields (created_at, updated_at) for entities that require them
- **FR-011**: System MUST support filtering and querying by entity attributes
- **FR-012**: System MUST be located in the packages/agent-core shared package
- **FR-013**: System MUST throw typed errors: `DatabaseError` for DB failures, `NotFoundError` for missing records, `ValidationError` for constraint violations
- **FR-014**: System MUST provide structured JSON logging with correlation IDs; log DB initialization, migration execution, and slow queries (>100ms)

### Key Entities

- **Database Files**: Two SQLite files in `{data_dir}/data/`: `myboteam.db` (production), `myboteam_dev.db` (development). Test mode uses `:memory:` (in-memory database) for fast, isolated tests. Data dir managed by M2-5 Data Directory Manager (default `~/.myboteam/`, configurable via `MYBOTEAM_DATA_DIR` env).
- **Agent**: Represents an AI agent with slug, provider, model, and status. Deleting an agent CASCADE deletes tasks, conversations, memory_entries, and agent_mcp_assignments; RESTRICT if agent has active (non-completed) tasks.
- **Task**: Work unit assigned to an agent with status tracking and verification state. Status values: pending, running, partial, completed, failed, max_retries (all stored as enum). Verification status stored as separate field. Transitions enforced by application logic (CompletionEnforcer), not DB constraints.
- **TaskTodo**: Validation item within a task, linked to task completion
- **Conversation**: Thread of interaction between user and agent
- **Message**: Individual message within a conversation with role and content
- **MemoryEntry**: Knowledge contributed by an agent, categorized for retrieval
- **McpServer**: External tool server configuration and status
- **AgentMcpAssignment**: Join table linking agents to their assigned MCP servers
- **Note**: User-created note with type (text/checklist) and optional items
- **Schedule**: Recurring or one-time scheduled task with expression
- **DocumentVersion**: Versioned document content with file path and model reference

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Storage layer initializes a new database with all 11 tables in under 500ms
- **SC-002**: All CRUD operations complete in under 100ms for individual records
- **SC-003**: WAL mode is confirmed active after database initialization
- **SC-004**: Unit tests cover every CRUD operation for every entity
- **SC-005**: Schema matches AD.md ER diagram with zero discrepancies
- **SC-006**: Seeding mechanism populates at least one record per entity type and supports production bootstrapping of agents and tools
- **SC-007**: Migration system is idempotent — running twice produces identical schema

## Assumptions

- The AD.md ER diagram is the authoritative source for schema design
- v0.2.0 database-service.ts logic informs the new implementation but is not directly reusable (sql.js → better-sqlite3 migration)
- M1-2 (pnpm workspace) and M1-4 (TypeScript config) will be completed before this feature
- The storage layer is a shared package (packages/agent-core) consumed by apps/daemon
- better-sqlite3 is synchronous (blocking) — acceptable for single-user desktop app
- UUID generation uses the `uuid` package or Node.js crypto.randomUUID()
- No concurrent write conflicts expected (single-user desktop app with WAL mode)
- The consolidated init migration replaces all v0.2.0 incremental migrations
- Seeding mechanism supports multiple modes: dev (sample data), test (minimal data), production (default agents/tools)

## Clarifications

### Session 2026-06-25

- Q: Which task status values and transitions must the storage layer support at the schema level? → A: Store all 6 status values (pending, running, partial, completed, failed, max_retries) + verification_status as enums; no DB-level transition constraints — application logic (CompletionEnforcer) handles transitions
- Q: What cascade delete rules should the storage layer enforce? → A: CASCADE delete for tasks, conversations, memory_entries, agent_mcp_assignments; RESTRICT if agent has active (non-completed) tasks
- Q: Where should the SQLite database files be stored? → A: Two files in `{data_dir}/data/` (from M2-5 Data Directory Manager): `myboteam.db` (production), `myboteam_dev.db` (development). Test mode uses `:memory:` (in-memory database). Data dir defaults to `~/.myboteam/`, configurable via `MYBOTEAM_DATA_DIR` env.
- Q: How should the storage layer surface errors to callers? → A: Throw typed errors — `DatabaseError` for DB failures, `NotFoundError` for missing records, `ValidationError` for constraint violations. Callers use try/catch.
- Q: What logging and observability should the storage layer include? → A: Structured JSON logging with correlation IDs; log DB initialization, migration execution, and slow queries (>100ms). Suitable for future log aggregation.
- Q: What default agents and MCP servers should be bootstrapped in production mode? → A: Production seeding bootstraps two default agents: "secretary" (anthropic/claude-sonnet-4-20250514) and "accountant" (openai/gpt-4). No default MCP servers are bootstrapped — users configure tools via the UI after first run.
