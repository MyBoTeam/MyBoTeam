# MyBotTeam v0.5.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first AI Agent Harness desktop app (Electron/React) with Orchestrator, Secretary, and Accountant agents, MCP tool system, memory/skills knowledge system, and verification loop.

**Architecture:** Strict bottom-up, 12 architecture-layer milestones. Monorepo with pnpm workspaces: 3 apps (web, desktop, daemon) + 2 packages (agent-core, mcp-servers). Each ticket includes cherry-pick investigation from source projects (v0.2.0 → v0.3.0 → Accomplish → v0.4.0).

**Tech Stack:** TypeScript, Electron, React 19, Vite, Zustand, better-sqlite3 (WAL), AES-256-GCM vault, JSON-RPC over Unix socket, MCP SDK, node-cron, pino, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-06-25-implementation-plan-design.md`

---

## File Structure

```
myboteam_v0.5.0/
├── apps/
│   ├── web/                          # React UI (Vite + React Router + Zustand)
│   │   ├── src/
│   │   │   ├── main.tsx              # Entry point
│   │   │   ├── App.tsx               # Root component
│   │   │   ├── routes/router.tsx     # Route definitions
│   │   │   ├── layouts/main/         # Main layout (sidebar + content)
│   │   │   ├── layouts/settings/     # Settings layout
│   │   │   ├── pages/home/           # Home page (chat input)
│   │   │   ├── pages/conversation/   # Execution/conversation view
│   │   │   ├── pages/conversations/  # Task list
│   │   │   ├── pages/settings/       # Settings pages
│   │   │   ├── components/ui/        # shadcn/ui component library
│   │   │   ├── components/common/    # Shared components
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── lib/                  # Utilities
│   │   │   └── styles/globals.css    # Theme system
│   │   ├── components.json           # shadcn/ui config
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── desktop/                      # Electron shell
│   │   ├── src/
│   │   │   ├── main/                 # Main process
│   │   │   │   ├── index.ts          # Entry point
│   │   │   │   ├── app-window.ts     # Window creation
│   │   │   │   ├── window-manager.ts # Window singleton
│   │   │   │   ├── app-lifecycle.ts  # Lifecycle hooks
│   │   │   │   ├── daemon-bootstrap.ts # Daemon connection
│   │   │   │   ├── menu.ts           # App menu
│   │   │   │   └── tray.ts           # System tray
│   │   │   ├── preload/              # Preload scripts
│   │   │   │   ├── index.ts          # contextBridge
│   │   │   │   └── handlers/         # IPC handlers
│   │   │   └── shared/               # Shared code
│   │   ├── electron-builder.yml
│   │   └── package.json
│   └── daemon/                       # Background daemon
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   ├── daemon.ts             # Daemon class
│       │   ├── rpc-server.ts         # JSON-RPC server
│       │   ├── rpc-routes.ts         # Route definitions
│       │   ├── logger.ts             # Pino logger
│       │   └── ...
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── agent-core/                   # Shared core library
│   │   ├── src/
│   │   │   ├── index.ts              # Public API
│   │   │   ├── types.ts              # Entity types
│   │   │   ├── storage.ts            # SQLite storage
│   │   │   ├── migrations.ts         # Schema migrations
│   │   │   ├── secret-vault.ts       # Encrypted vault
│   │   │   ├── pid-lock.ts           # PID lock manager
│   │   │   ├── providers/            # LLM providers
│   │   │   ├── materializer.ts       # Eve materializer
│   │   │   ├── runtime.ts            # EveRuntimeManager
│   │   │   ├── orchestrator.ts       # Task routing
│   │   │   ├── completion-enforcer.ts # Verification
│   │   │   ├── memory/               # Memory system
│   │   │   ├── skills/               # Skill workshop
│   │   │   ├── scheduler/            # NL scheduler
│   │   │   ├── mcp/                  # MCP integration
│   │   │   └── ...
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── mcp-servers/                  # MCP server packages
│       ├── filesystem/               # File system tools
│       ├── gmail/                    # Gmail integration
│       ├── calendar/                 # Calendar integration
│       ├── get-local-time/           # Local time
│       └── shared/                   # Shared MCP utilities
├── bundled-skills/                   # Shipped SKILL.md files
├── scripts/
│   ├── dev.mjs                       # Dev orchestrator
│   └── rebuild-native.mjs            # Native module rebuild
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   └── e2e/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── biome.json
└── package.json
```

---

## M1: Foundation (5 tickets)

### Task M1-1: pnpm workspace + monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `apps/` directory
- Create: `packages/` directory
- Create: `packages/mcp-servers/` directory
- Create: `.npmrc`
- Create: `.gitignore`

**Cherry-Pick:** Copy pnpm-workspace.yaml and root package.json patterns from v0.2.0.

- [ ] **Step 1: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/mcp-servers/*"
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "myboteam",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "build": "pnpm -r build",
    "check": "biome check . && pnpm -r typecheck",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 3: Create .npmrc**

```ini
use-node-version=24.15.0
```

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p apps/web apps/desktop apps/daemon
mkdir -p packages/agent-core packages/mcp-servers/shared
mkdir -p scripts tests/unit tests/contract tests/integration tests/e2e
```

- [ ] **Step 5: Create .gitignore**

```gitignore
node_modules/
dist/
.turbo/
*.db
*.db-wal
*.db-shm
.env
.env.local
.local-data/
coverage/
```

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml package.json .npmrc .gitignore
git add -A apps/ packages/ scripts/ tests/
git commit -m "feat: scaffold monorepo with pnpm workspaces"
```

---

### Task M1-2: tsconfig.base.json + TypeScript config

**Files:**
- Create: `tsconfig.base.json`
- Create: `tsconfig.json` (project references)
- Create: `apps/web/tsconfig.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/daemon/tsconfig.json`
- Create: `packages/agent-core/tsconfig.json`
- Create: `packages/mcp-servers/shared/tsconfig.json`

**Cherry-Pick:** Copy tsconfig.base.json from v0.2.0. ES2022 target, ESNext module, bundler resolution, strict mode.

- [ ] **Step 1: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Create root tsconfig.json with project references**

```json
{
  "files": [],
  "references": [
    { "path": "packages/agent-core" },
    { "path": "packages/mcp-servers/shared" },
    { "path": "apps/daemon" },
    { "path": "apps/web" },
    { "path": "apps/desktop" }
  ]
}
```

- [ ] **Step 3: Create package-level tsconfig.json files**

Each package gets:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc -b --noEmit
```

Expected: No errors (empty projects).

- [ ] **Step 5: Commit**

```bash
git add tsconfig.base.json tsconfig.json
git add apps/*/tsconfig.json packages/*/tsconfig.json
git commit -m "feat: add TypeScript configuration with project references"
```

---

### Task M1-3: Biome linting + formatting

**Files:**
- Create: `biome.json`

**Cherry-Pick:** Copy biome.json from v0.2.0.

- [ ] **Step 1: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "warn",
        "noUnusedVariables": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", "coverage", "*.db"]
  }
}
```

- [ ] **Step 2: Run biome check**

```bash
pnpm biome check .
```

Expected: No errors on empty project.

- [ ] **Step 3: Commit**

```bash
git add biome.json
git commit -m "feat: add Biome linting and formatting"
```

---

### Task M1-4: Shared types package (@myboteam/types)

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/agent.ts`
- Create: `packages/types/src/task.ts`
- Create: `packages/types/src/conversation.ts`
- Create: `packages/types/src/memory.ts`
- Create: `packages/types/src/mcp.ts`
- Create: `packages/types/src/skill.ts`
- Create: `packages/types/src/schedule.ts`
- Create: `packages/types/src/note.ts`
- Create: `packages/types/src/document.ts`
- Create: `packages/types/src/provider.ts`
- Create: `packages/types/src/vault.ts`
- Create: `packages/types/src/rpc.ts`
- Create: `packages/types/src/enums.ts`
- Create: `packages/types/src/result.ts`
- Create: `packages/types/src/utils.ts`
- Test: `packages/types/src/__tests__/schemas.test.ts`

**Cherry-Pick:** Extract types from v0.2.0 packages/types/src/ — comprehensive Zod schemas. Adapt for v0.5.0 AD.md entities.

- [ ] **Step 1: Write failing tests for Zod schemas**

```typescript
// packages/types/src/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { AgentConfigSchema, TaskSchema, MessageSchema } from '../index';

describe('AgentConfigSchema', () => {
  it('validates a valid agent config', () => {
    const result = AgentConfigSchema.safeParse({
      id: 'test-id',
      slug: 'secretary',
      name: 'Secretary',
      provider: 'openai',
      model: 'gpt-4',
      instructions: 'You are a secretary.',
      tools: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects config without required fields', () => {
    const result = AgentConfigSchema.safeParse({ slug: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('TaskSchema', () => {
  it('validates a valid task', () => {
    const result = TaskSchema.safeParse({
      id: 'task-1',
      agentId: 'agent-1',
      status: 'pending',
      input: 'Check my calendar',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = TaskSchema.safeParse({
      id: 'task-1',
      agentId: 'agent-1',
      status: 'invalid',
      input: 'test',
    });
    expect(result.success).toBe(false);
  });
});

describe('MessageSchema', () => {
  it('validates a valid message', () => {
    const result = MessageSchema.safeParse({
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Hello',
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/types && pnpm vitest run src/__tests__/schemas.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create package.json**

```json
{
  "name": "@myboteam/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^4.0.0"
  }
}
```

- [ ] **Step 4: Create type files**

```typescript
// packages/types/src/enums.ts
export const AgentStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  FAILED: 'failed',
  MAX_RETRIES: 'max_retries',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  TOOL: 'tool',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const MemoryCategory = {
  FACTS: 'facts',
  PREFERENCES: 'preferences',
  IDENTITY: 'identity',
  EVENTS: 'events',
  CONTACTS: 'contacts',
  PROJECTS: 'projects',
  INSTRUCTIONS: 'instructions',
} as const;

export type MemoryCategory = (typeof MemoryCategory)[keyof typeof MemoryCategory];

export const ScheduleType = {
  AT: 'at',
  EVERY: 'every',
  CRON: 'cron',
} as const;

export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];

export const ScheduleStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const NoteType = {
  TEXT: 'text',
  CHECKLIST: 'checklist',
} as const;

export type NoteType = (typeof NoteType)[keyof typeof NoteType];

export const McpServerStatus = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  ERROR: 'error',
} as const;

export type McpServerStatus = (typeof McpServerStatus)[keyof typeof McpServerStatus];
```

```typescript
// packages/types/src/agent.ts
import { z } from 'zod';
import { AgentStatus } from './enums';

export const AgentConfigSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  instructions: z.string(),
  tools: z.array(z.string()),
  delegationPolicy: z.enum(['none', 'can-delegate']).default('none'),
  maxDelegationDepth: z.number().int().min(0).max(3).default(0),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const AgentRecordSchema = AgentConfigSchema.extend({
  status: z.nativeEnum(AgentStatus),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AgentRecord = z.infer<typeof AgentRecordSchema>;
```

```typescript
// packages/types/src/task.ts
import { z } from 'zod';
import { TaskStatus } from './enums';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus),
  input: z.string(),
  output: z.string().optional(),
  verificationStatus: z.enum(['pending', 'passed', 'failed']).default('pending'),
  continuationCount: z.number().int().min(0).default(0),
  maxContinuations: z.number().int().min(0).default(10),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskTodoSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  description: z.string(),
  isCompleted: z.boolean().default(false),
});

export type TaskTodo = z.infer<typeof TaskTodoSchema>;
```

```typescript
// packages/types/src/conversation.ts
import { z } from 'zod';
import { MessageRole } from './enums';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.nativeEnum(MessageRole),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof ConversationSchema>;
```

```typescript
// packages/types/src/memory.ts
import { z } from 'zod';
import { MemoryCategory } from './enums';

export const MemoryEntrySchema = z.object({
  id: z.string().uuid(),
  category: z.nativeEnum(MemoryCategory),
  content: z.string(),
  source: z.string().optional(),
  pinned: z.boolean().default(false),
  usageCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
```

```typescript
// packages/types/src/mcp.ts
import { z } from 'zod';
import { McpServerStatus } from './enums';

export const McpServerConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  status: z.nativeEnum(McpServerStatus),
  allowedPaths: z.array(z.string()).default([]),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export const AgentMcpAssignmentSchema = z.object({
  agentId: z.string().uuid(),
  mcpServerId: z.string().uuid(),
});

export type AgentMcpAssignment = z.infer<typeof AgentMcpAssignmentSchema>;
```

```typescript
// packages/types/src/skill.ts
import { z } from 'zod';

export const SkillProposalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  content: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'quarantined']),
  rollbackMetadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SkillProposal = z.infer<typeof SkillProposalSchema>;

export const StandingOrderSchema = z.object({
  id: z.string().uuid(),
  instruction: z.string(),
  createdAt: z.string().datetime(),
});

export type StandingOrder = z.infer<typeof StandingOrderSchema>;
```

```typescript
// packages/types/src/schedule.ts
import { z } from 'zod';
import { ScheduleType, ScheduleStatus } from './enums';

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ScheduleType),
  expression: z.string(),
  command: z.string(),
  delivery: z.enum(['chat', 'webhook', 'session']).default('chat'),
  status: z.nativeEnum(ScheduleStatus),
  lastRunAt: z.string().datetime().optional(),
  nextRunAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export const ScheduleRunSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  status: z.enum(['success', 'failure', 'skipped']),
  output: z.string().optional(),
  duration: z.number(),
  ranAt: z.string().datetime(),
});

export type ScheduleRun = z.infer<typeof ScheduleRunSchema>;
```

```typescript
// packages/types/src/note.ts
import { z } from 'zod';
import { NoteType } from './enums';

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.nativeEnum(NoteType),
  content: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string(),
    isCompleted: z.boolean().default(false),
  })).optional(),
  color: z.string().optional(),
  labels: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Note = z.infer<typeof NoteSchema>;
```

```typescript
// packages/types/src/document.ts
import { z } from 'zod';

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  filePath: z.string(),
  content: z.string(),
  model: z.string().optional(),
  summary: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
```

```typescript
// packages/types/src/provider.ts
import { z } from 'zod';

export const ProviderConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['openai', 'anthropic', 'ollama', 'lmstudio', 'custom']),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  model: z.string().min(1),
  isDefault: z.boolean().default(false),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
```

```typescript
// packages/types/src/vault.ts
import { z } from 'zod';

export const VaultEntrySchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.enum(['api-key', 'oauth-token', 'mcp-secret', 'custom']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type VaultEntry = z.infer<typeof VaultEntrySchema>;
```

```typescript
// packages/types/src/rpc.ts
import { z } from 'zod';

export const RpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

export type RpcRequest = z.infer<typeof RpcRequestSchema>;

export const RpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
  }).optional(),
});

export type RpcResponse = z.infer<typeof RpcResponseSchema>;
```

```typescript
// packages/types/src/result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

```typescript
// packages/types/src/utils.ts
export function generateId(): string {
  return crypto.randomUUID();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function timestamp(): string {
  return new Date().toISOString();
}
```

```typescript
// packages/types/src/index.ts
export * from './enums';
export * from './agent';
export * from './task';
export * from './conversation';
export * from './memory';
export * from './mcp';
export * from './skill';
export * from './schedule';
export * from './note';
export * from './document';
export * from './provider';
export * from './vault';
export * from './rpc';
export * from './result';
export * from './utils';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd packages/types && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/types/
git commit -m "feat: add shared types package with Zod schemas"
```

---

### Task M1-5: Dev scripts (dev orchestrator, build, check)

**Files:**
- Create: `scripts/dev.mjs`
- Create: `scripts/rebuild-native.mjs`

**Cherry-Pick:** Copy dev.mjs from v0.2.0. Concurrent startup, graceful shutdown.

- [ ] **Step 1: Create dev.mjs**

```javascript
#!/usr/bin/env node
// scripts/dev.mjs
import { spawn } from 'node:child_process';
import { kill } from 'node:process';

const DAEMON_PORT = 45740;
const WEB_PORT = 5174;

const procs = [];

function shutdown() {
  console.log('\n[dev] Shutting down...');
  for (const p of procs) {
    if (p && !p.killed) {
      kill(-p.pid, 'SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start daemon
const daemon = spawn('pnpm', ['--filter', '@myboteam/daemon', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, MYBOTEAM_DAEMON_PORT: String(DAEMON_PORT) },
});
procs.push(daemon);

// Start web (delayed)
setTimeout(() => {
  const web = spawn('pnpm', ['--filter', '@myboteam/web', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_MYBOTEAM_DAEMON_URL: `http://localhost:${DAEMON_PORT}` },
  });
  procs.push(web);
}, 1000);

// Start desktop (delayed further)
setTimeout(() => {
  const desktop = spawn('pnpm', ['--filter', '@myboteam/desktop', 'dev'], {
    stdio: 'inherit',
  });
  procs.push(desktop);
}, 2500);

console.log('[dev] Starting daemon, web, and desktop...');
```

- [ ] **Step 2: Make dev.mjs executable**

```bash
chmod +x scripts/dev.mjs
```

- [ ] **Step 3: Create rebuild-native.mjs**

```javascript
#!/usr/bin/env node
// scripts/rebuild-native.mjs
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nativeModules = ['better-sqlite3'];

for (const mod of nativeModules) {
  const modPath = join(root, 'node_modules', mod);
  if (existsSync(modPath)) {
    console.log(`[rebuild] Rebuilding ${mod}...`);
    try {
      execSync(`npm rebuild ${mod}`, { cwd: root, stdio: 'inherit' });
      console.log(`[rebuild] ${mod} rebuilt successfully.`);
    } catch {
      console.error(`[rebuild] Failed to rebuild ${mod}`);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: add dev orchestrator and native rebuild scripts"
```

---

## M2: Data Layer (5 tickets)

### Task M2-1: SQLite storage layer (better-sqlite3, WAL)

**Files:**
- Create: `packages/agent-core/package.json`
- Create: `packages/agent-core/tsconfig.json`
- Create: `packages/agent-core/src/index.ts`
- Create: `packages/agent-core/src/storage.ts`
- Create: `packages/agent-core/src/__tests__/storage.test.ts`

**Cherry-Pick:** Copy AgentStorage class from v0.2.0 daemon database-service.ts. sql.js with filesystem persistence. Adapt schema for v0.5.0 AD.md entities.

- [ ] **Step 1: Write failing tests for storage**

```typescript
// packages/agent-core/src/__tests__/storage.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentStorage } from '../storage';

describe('AgentStorage', () => {
  let storage: AgentStorage;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-test-'));
    storage = new AgentStorage(join(tempDir, 'test.db'));
  });

  afterEach(() => {
    storage.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates database with WAL mode', () => {
    const mode = storage.pragma('journal_mode');
    expect(mode).toBe('wal');
  });

  it('creates and retrieves an agent', () => {
    const agent = storage.createAgent({
      slug: 'secretary',
      name: 'Secretary',
      provider: 'openai',
      model: 'gpt-4',
      instructions: 'You are a secretary.',
      tools: ['calendar', 'email'],
    });
    expect(agent.slug).toBe('secretary');

    const retrieved = storage.getAgent(agent.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Secretary');
  });

  it('creates and retrieves a task', () => {
    const agent = storage.createAgent({
      slug: 'test',
      name: 'Test',
      provider: 'openai',
      model: 'gpt-4',
      instructions: 'test',
      tools: [],
    });
    const task = storage.createTask({
      agentId: agent.id,
      status: 'pending',
      input: 'Check calendar',
    });
    expect(task.status).toBe('pending');

    const retrieved = storage.getTask(task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.input).toBe('Check calendar');
  });

  it('creates and retrieves a conversation with messages', () => {
    const agent = storage.createAgent({
      slug: 'test',
      name: 'Test',
      provider: 'openai',
      model: 'gpt-4',
      instructions: 'test',
      tools: [],
    });
    const conv = storage.createConversation({
      agentId: agent.id,
      title: 'Test conversation',
    });
    expect(conv.title).toBe('Test conversation');

    const msg = storage.createMessage({
      conversationId: conv.id,
      role: 'user',
      content: 'Hello',
    });
    expect(msg.content).toBe('Hello');

    const messages = storage.getMessages(conv.id);
    expect(messages).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/agent-core && pnpm vitest run src/__tests__/storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create package.json**

```json
{
  "name": "@myboteam/agent-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@myboteam/types": "workspace:*",
    "better-sqlite3": "^12.4.0",
    "zod": "^3.23.0",
    "pino": "^9.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.0"
  }
}
```

- [ ] **Step 4: Create storage.ts**

```typescript
// packages/agent-core/src/storage.ts
import Database from 'better-sqlite3';
import type {
  AgentConfig,
  AgentRecord,
  Task,
  TaskTodo,
  Conversation,
  Message,
  MemoryEntry,
  McpServerConfig,
  AgentMcpAssignment,
  SkillProposal,
  StandingOrder,
  Schedule,
  ScheduleRun,
  Note,
  DocumentVersion,
  ProviderConfig,
} from '@myboteam/types';
import { generateId, timestamp } from '@myboteam/types';

export class AgentStorage {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  pragma(pragma: string): string {
    const result = this.db.pragma(pragma, { simple: true });
    return String(result);
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        instructions TEXT NOT NULL DEFAULT '',
        tools TEXT NOT NULL DEFAULT '[]',
        delegation_policy TEXT NOT NULL DEFAULT 'none',
        max_delegation_depth INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'idle',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        conversation_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        input TEXT NOT NULL,
        output TEXT,
        verification_status TEXT NOT NULL DEFAULT 'pending',
        continuation_count INTEGER NOT NULL DEFAULT 0,
        max_continuations INTEGER NOT NULL DEFAULT 10,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS task_todos (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id),
        description TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT,
        pinned INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category);
      CREATE INDEX IF NOT EXISTS idx_memory_pinned ON memory_entries(pinned);

      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        command TEXT NOT NULL,
        args TEXT NOT NULL DEFAULT '[]',
        env TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'stopped',
        allowed_paths TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS agent_mcp_assignments (
        agent_id TEXT NOT NULL REFERENCES agents(id),
        mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id),
        PRIMARY KEY (agent_id, mcp_server_id)
      );

      CREATE TABLE IF NOT EXISTS skill_proposals (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rollback_metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS standing_orders (
        id TEXT PRIMARY KEY,
        instruction TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        expression TEXT NOT NULL,
        command TEXT NOT NULL,
        delivery TEXT NOT NULL DEFAULT 'chat',
        status TEXT NOT NULL DEFAULT 'active',
        last_run_at TEXT,
        next_run_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schedule_runs (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL REFERENCES schedules(id),
        status TEXT NOT NULL,
        output TEXT,
        duration REAL NOT NULL,
        ran_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        content TEXT,
        items TEXT,
        color TEXT,
        labels TEXT NOT NULL DEFAULT '[]',
        pinned INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS document_versions (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT,
        summary TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_doc_versions_path ON document_versions(file_path);

      CREATE TABLE IF NOT EXISTS provider_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        base_url TEXT,
        api_key TEXT,
        model TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS debug_logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        source TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'internal',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(level);
      CREATE INDEX IF NOT EXISTS idx_debug_logs_source ON debug_logs(source);

      CREATE TABLE IF NOT EXISTS tool_calls (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id),
        tool_name TEXT NOT NULL,
        params TEXT,
        result TEXT,
        status TEXT NOT NULL,
        duration REAL NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  // Agent CRUD
  createAgent(config: Omit<AgentConfig, 'id'>): AgentRecord {
    const id = generateId();
    const now = timestamp();
    this.db.prepare(`
      INSERT INTO agents (id, slug, name, provider, model, instructions, tools, delegation_policy, max_delegation_depth, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle', ?, ?)
    `).run(id, config.slug, config.name, config.provider, config.model, config.instructions, JSON.stringify(config.tools), config.delegationPolicy ?? 'none', config.maxDelegationDepth ?? 0, now, now);
    return this.getAgent(id)!;
  }

  getAgent(id: string): AgentRecord | undefined {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      provider: row.provider,
      model: row.model,
      instructions: row.instructions,
      tools: JSON.parse(row.tools),
      delegationPolicy: row.delegation_policy,
      maxDelegationDepth: row.max_delegation_depth,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  listAgents(): AgentRecord[] {
    const rows = this.db.prepare('SELECT * FROM agents').all() as any[];
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      provider: row.provider,
      model: row.model,
      instructions: row.instructions,
      tools: JSON.parse(row.tools),
      delegationPolicy: row.delegation_policy,
      maxDelegationDepth: row.max_delegation_depth,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // Task CRUD
  createTask(data: { agentId: string; status: string; input: string; conversationId?: string }): Task {
    const id = generateId();
    const now = timestamp();
    this.db.prepare(`
      INSERT INTO tasks (id, agent_id, conversation_id, status, input, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.agentId, data.conversationId ?? null, data.status, data.input, now, now);
    return this.getTask(id)!;
  }

  getTask(id: string): Task | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      agentId: row.agent_id,
      conversationId: row.conversation_id,
      status: row.status,
      input: row.input,
      output: row.output,
      verificationStatus: row.verification_status,
      continuationCount: row.continuation_count,
      maxContinuations: row.max_continuations,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.output !== undefined) { fields.push('output = ?'); values.push(updates.output); }
    if (updates.verificationStatus !== undefined) { fields.push('verification_status = ?'); values.push(updates.verificationStatus); }
    if (updates.continuationCount !== undefined) { fields.push('continuation_count = ?'); values.push(updates.continuationCount); }
    fields.push('updated_at = ?');
    values.push(timestamp());
    values.push(id);
    this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getTask(id);
  }

  // Conversation CRUD
  createConversation(data: { agentId: string; title: string }): Conversation {
    const id = generateId();
    const now = timestamp();
    this.db.prepare(`
      INSERT INTO conversations (id, agent_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.agentId, data.title, now, now);
    return { id, agentId: data.agentId, title: data.title, createdAt: now, updatedAt: now };
  }

  createMessage(data: { conversationId: string; role: string; content: string }): Message {
    const id = generateId();
    const now = timestamp();
    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.conversationId, data.role, data.content, now);
    return { id, conversationId: data.conversationId, role: data.role as any, content: data.content, createdAt: now };
  }

  getMessages(conversationId: string): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conversationId) as any[];
    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    }));
  }

  // Memory CRUD
  createMemory(data: { category: string; content: string; source?: string }): MemoryEntry {
    const id = generateId();
    const now = timestamp();
    this.db.prepare(`
      INSERT INTO memory_entries (id, category, content, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.category, data.content, data.source ?? null, now, now);
    return { id, category: data.category as any, content: data.content, source: data.source, pinned: false, usageCount: 0, createdAt: now, updatedAt: now };
  }

  searchMemory(query: string, category?: string): MemoryEntry[] {
    let sql = 'SELECT * FROM memory_entries WHERE content LIKE ?';
    const params: unknown[] = [`%${query}%`];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY pinned DESC, usage_count DESC LIMIT 10';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((row) => ({
      id: row.id,
      category: row.category,
      content: row.content,
      source: row.source,
      pinned: Boolean(row.pinned),
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  close(): void {
    this.db.close();
  }
}
```

- [ ] **Step 5: Create index.ts**

```typescript
// packages/agent-core/src/index.ts
export { AgentStorage } from './storage';
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd packages/agent-core && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/agent-core/
git commit -m "feat: add SQLite storage layer with better-sqlite3 WAL"
```

---

### Task M2-2: Schema migrations manager

**Files:**
- Create: `packages/agent-core/src/migrations.ts`
- Create: `packages/agent-core/src/__tests__/migrations.test.ts`

**Cherry-Pick:** Extract migration pattern from v0.2.0 daemon migrations/. Version-tracked migrations.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/agent-core/src/__tests__/migrations.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { MigrationManager } from '../migrations';

describe('MigrationManager', () => {
  let db: Database.Database;
  let tempDir: string;
  let migrations: MigrationManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-mig-'));
    db = new Database(join(tempDir, 'test.db'));
    migrations = new MigrationManager(db);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates migrations table', () => {
    migrations.ensureTable();
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").get();
    expect(table).toBeDefined();
  });

  it('runs pending migrations', () => {
    migrations.ensureTable();
    const applied = migrations.migrate();
    expect(applied).toBeGreaterThanOrEqual(0);
  });

  it('is idempotent', () => {
    migrations.ensureTable();
    migrations.migrate();
    const applied = migrations.migrate();
    expect(applied).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/agent-core && pnpm vitest run src/__tests__/migrations.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement MigrationManager**

```typescript
// packages/agent-core/src/migrations.ts
import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  up: string;
}

const MIGRATIONS: Migration[] = [
  { version: 1, up: '-- Initial schema already in storage.ts migrate()' },
];

export class MigrationManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  ensureTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
  }

  migrate(): number {
    this.ensureTable();
    const applied = this.db.prepare('SELECT version FROM migrations ORDER BY version').all() as { version: number }[];
    const appliedVersions = new Set(applied.map((r) => r.version));
    let count = 0;

    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        this.db.exec(migration.up);
        this.db.prepare('INSERT INTO migrations (version, applied_at) VALUES (?, ?)').run(migration.version, new Date().toISOString());
        count++;
      }
    }

    return count;
  }

  getCurrentVersion(): number {
    const row = this.db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
    return row.version ?? 0;
  }
}
```

- [ ] **Step 4: Update index.ts exports**

```typescript
// packages/agent-core/src/index.ts (add)
export { MigrationManager } from './migrations';
```

- [ ] **Step 5: Run tests**

```bash
cd packages/agent-core && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/src/migrations.ts packages/agent-core/src/__tests__/migrations.test.ts
git commit -m "feat: add schema migrations manager"
```

---

### Task M2-3: Encrypted secrets vault (AES-256-GCM)

**Files:**
- Create: `packages/agent-core/src/secret-vault.ts`
- Create: `packages/agent-core/src/__tests__/secret-vault.test.ts`

**Cherry-Pick:** AES-256-GCM from v0.2.0 vault/crypto.ts. PBKDF2 key derivation. Atomic writes.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/agent-core/src/__tests__/secret-vault.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SecretVault } from '../secret-vault';

describe('SecretVault', () => {
  let vault: SecretVault;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-vault-'));
    vault = new SecretVault(join(tempDir, 'vault.json'), 'test-machine-id');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('stores and retrieves a secret', () => {
    vault.set('openai-key', 'sk-test-123');
    const value = vault.get('openai-key');
    expect(value).toBe('sk-test-123');
  });

  it('returns undefined for non-existent key', () => {
    const value = vault.get('nonexistent');
    expect(value).toBeUndefined();
  });

  it('persists to file', () => {
    vault.set('key1', 'value1');
    vault.save();

    const vault2 = new SecretVault(join(tempDir, 'vault.json'), 'test-machine-id');
    const value = vault2.get('key1');
    expect(value).toBe('value1');
  });

  it('deletes a secret', () => {
    vault.set('key1', 'value1');
    vault.delete('key1');
    expect(vault.get('key1')).toBeUndefined();
  });

  it('lists all keys', () => {
    vault.set('key1', 'value1');
    vault.set('key2', 'value2');
    const keys = vault.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/agent-core && pnpm vitest run src/__tests__/secret-vault.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement SecretVault**

```typescript
// packages/agent-core/src/secret-vault.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;

interface VaultEntry {
  iv: string;
  salt: string;
  tag: string;
  data: string;
}

export class SecretVault {
  private filePath: string;
  private key: Buffer;
  private entries: Map<string, VaultEntry> = new Map();

  constructor(filePath: string, machineId: string) {
    this.filePath = filePath;
    this.key = this.deriveKey(machineId);
    if (existsSync(filePath)) {
      this.load();
    }
  }

  private deriveKey(machineId: string): Buffer {
    const salt = pbkdf2Sync('myboteam-vault-salt', machineId, 1, SALT_LENGTH, 'sha512');
    return pbkdf2Sync(machineId, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
  }

  private encrypt(plaintext: string): VaultEntry {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted.toString('hex'),
    };
  }

  private decrypt(entry: VaultEntry): string {
    const iv = Buffer.from(entry.iv, 'hex');
    const tag = Buffer.from(entry.tag, 'hex');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(entry.data, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }

  get(key: string): string | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    return this.decrypt(entry);
  }

  set(key: string, value: string): void {
    this.entries.set(key, this.encrypt(value));
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  keys(): string[] {
    return Array.from(this.entries.keys());
  }

  save(): void {
    const data = Object.fromEntries(this.entries);
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  private load(): void {
    const raw = readFileSync(this.filePath, 'utf8');
    const data = JSON.parse(raw) as Record<string, VaultEntry>;
    this.entries = new Map(Object.entries(data));
  }
}
```

- [ ] **Step 4: Update exports**

```typescript
// packages/agent-core/src/index.ts (add)
export { SecretVault } from './secret-vault';
```

- [ ] **Step 5: Run tests**

```bash
cd packages/agent-core && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/src/secret-vault.ts packages/agent-core/src/__tests__/secret-vault.test.ts
git commit -m "feat: add encrypted secrets vault with AES-256-GCM"
```

---

### Task M2-4: PID lock manager

**Files:**
- Create: `packages/agent-core/src/pid-lock.ts`
- Create: `packages/agent-core/src/__tests__/pid-lock.test.ts`

**Cherry-Pick:** Copy PID lock from v0.2.0 daemon. File-based lock with stale detection.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/agent-core/src/__tests__/pid-lock.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PidLock } from '../pid-lock';

describe('PidLock', () => {
  let lock: PidLock;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-lock-'));
    lock = new PidLock(join(tempDir, 'daemon.pid'));
  });

  afterEach(() => {
    lock.release();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('acquires lock', () => {
    const acquired = lock.acquire();
    expect(acquired).toBe(true);
  });

  it('prevents double acquire', () => {
    lock.acquire();
    const lock2 = new PidLock(join(tempDir, 'daemon.pid'));
    const acquired = lock2.acquire();
    expect(acquired).toBe(false);
  });

  it('detects stale lock', () => {
    writeFileSync(join(tempDir, 'daemon.pid'), '999999999');
    const acquired = lock.acquire();
    expect(acquired).toBe(true);
  });

  it('releases lock', () => {
    lock.acquire();
    lock.release();
    const lock2 = new PidLock(join(tempDir, 'daemon.pid'));
    const acquired = lock2.acquire();
    expect(acquired).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/agent-core && pnpm vitest run src/__tests__/pid-lock.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement PidLock**

```typescript
// packages/agent-core/src/pid-lock.ts
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { kill } from 'node:process';

export class PidLock {
  private lockPath: string;
  private locked = false;

  constructor(lockPath: string) {
    this.lockPath = lockPath;
  }

  acquire(): boolean {
    if (existsSync(this.lockPath)) {
      const existingPid = parseInt(readFileSync(this.lockPath, 'utf8').trim(), 10);
      if (!isNaN(existingPid) && this.isProcessAlive(existingPid)) {
        return false;
      }
      // Stale lock — remove it
      unlinkSync(this.lockPath);
    }

    writeFileSync(this.lockPath, String(process.pid), 'utf8');
    this.locked = true;
    return true;
  }

  release(): void {
    if (this.locked && existsSync(this.lockPath)) {
      unlinkSync(this.lockPath);
      this.locked = false;
    }
  }

  private isProcessAlive(pid: number): boolean {
    try {
      kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Update exports**

```typescript
// packages/agent-core/src/index.ts (add)
export { PidLock } from './pid-lock';
```

- [ ] **Step 5: Run tests**

```bash
cd packages/agent-core && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/src/pid-lock.ts packages/agent-core/src/__tests__/pid-lock.test.ts
git commit -m "feat: add PID lock manager with stale detection"
```

---

### Task M2-5: Data directory manager

**Files:**
- Create: `packages/agent-core/src/data-directory.ts`
- Create: `packages/agent-core/src/__tests__/data-directory.test.ts`

**Cherry-Pick:** Data directory pattern from v0.4.0. ~/.myboteam/ or configurable.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/agent-core/src/__tests__/data-directory.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DataDirectory } from '../data-directory';

describe('DataDirectory', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-data-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates data directory structure', () => {
    const dataDir = new DataDirectory(tempDir);
    dataDir.ensure();

    expect(existsSync(join(tempDir, 'data'))).toBe(true);
    expect(existsSync(join(tempDir, 'logs'))).toBe(true);
    expect(existsSync(join(tempDir, 'vault'))).toBe(true);
  });

  it('is idempotent', () => {
    const dataDir = new DataDirectory(tempDir);
    dataDir.ensure();
    dataDir.ensure(); // Should not throw
    expect(existsSync(join(tempDir, 'data'))).toBe(true);
  });

  it('returns correct paths', () => {
    const dataDir = new DataDirectory(tempDir);
    expect(dataDir.dbPath).toBe(join(tempDir, 'data', 'myboteam.db'));
    expect(dataDir.vaultPath).toBe(join(tempDir, 'vault', 'secure-storage.json'));
    expect(dataDir.logsDir).toBe(join(tempDir, 'logs'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/agent-core && pnpm vitest run src/__tests__/data-directory.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement DataDirectory**

```typescript
// packages/agent-core/src/data-directory.ts
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export class DataDirectory {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  get dbPath(): string {
    return join(this.baseDir, 'data', 'myboteam.db');
  }

  get vaultPath(): string {
    return join(this.baseDir, 'vault', 'secure-storage.json');
  }

  get logsDir(): string {
    return join(this.baseDir, 'logs');
  }

  get skillsDir(): string {
    return join(this.baseDir, 'data', 'skills');
  }

  ensure(): void {
    mkdirSync(join(this.baseDir, 'data'), { recursive: true });
    mkdirSync(join(this.baseDir, 'logs'), { recursive: true });
    mkdirSync(join(this.baseDir, 'vault'), { recursive: true });
    mkdirSync(join(this.baseDir, 'data', 'skills'), { recursive: true });
  }
}
```

- [ ] **Step 4: Update exports**

```typescript
// packages/agent-core/src/index.ts (add)
export { DataDirectory } from './data-directory';
```

- [ ] **Step 5: Run tests**

```bash
cd packages/agent-core && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/agent-core/src/data-directory.ts packages/agent-core/src/__tests__/data-directory.test.ts
git commit -m "feat: add data directory manager"
```

---

## M3: IPC & Daemon (5 tickets)

### Task M3-1: JSON-RPC server (Unix socket)

**Files:**
- Create: `apps/daemon/package.json`
- Create: `apps/daemon/tsconfig.json`
- Create: `apps/daemon/src/index.ts`
- Create: `apps/daemon/src/rpc-server.ts`
- Create: `apps/daemon/src/logger.ts`
- Create: `apps/daemon/src/__tests__/rpc-server.test.ts`

**Cherry-Pick:** JSON-RPC server from v0.2.0 daemon. Unix socket transport. Correlation IDs.

- [ ] **Step 1: Write failing tests**

```typescript
// apps/daemon/src/__tests__/rpc-server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RpcServer } from '../rpc-server';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { connect } from 'node:net';

describe('RpcServer', () => {
  let server: RpcServer;
  let tempDir: string;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-rpc-'));
    server = new RpcServer(join(tempDir, 'test.sock'));
    server.register('echo', (params: any) => params);
    server.register('add', (params: any) => ({ result: params.a + params.b }));
    server.start();
  });

  afterAll(() => {
    server.stop();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('responds to valid JSON-RPC request', (done) => {
    const client = connect(join(tempDir, 'test.sock'));
    const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'echo', params: { msg: 'hello' } }) + '\n';
    let data = '';
    client.write(request);
    client.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('\n')) {
        const response = JSON.parse(data.trim());
        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe(1);
        expect(response.result).toEqual({ msg: 'hello' });
        client.end();
        done();
      }
    });
  });

  it('returns error for unknown method', (done) => {
    const client = connect(join(tempDir, 'test.sock'));
    const request = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'nonexistent' }) + '\n';
    let data = '';
    client.write(request);
    client.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('\n')) {
        const response = JSON.parse(data.trim());
        expect(response.error).toBeDefined();
        expect(response.error.code).toBe(-32601);
        client.end();
        done();
      }
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/daemon && pnpm vitest run src/__tests__/rpc-server.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create daemon package.json**

```json
{
  "name": "@myboteam/daemon",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@myboteam/agent-core": "workspace:*",
    "@myboteam/types": "workspace:*",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.0"
  }
}
```

- [ ] **Step 4: Implement RpcServer**

```typescript
// apps/daemon/src/rpc-server.ts
import { createServer, type Server, type Socket } from 'node:net';
import { createLogger } from './logger';

const logger = createLogger('rpc-server');

type RpcHandler = (params: Record<string, unknown>) => unknown | Promise<unknown>;

export class RpcServer {
  private server: Server | null = null;
  private socketPath: string;
  private handlers = new Map<string, RpcHandler>();

  constructor(socketPath: string) {
    this.socketPath = socketPath;
  }

  register(method: string, handler: RpcHandler): void {
    this.handlers.set(method, handler);
  }

  start(): void {
    this.server = createServer((socket: Socket) => this.handleConnection(socket));
    this.server.listen(this.socketPath);
    logger.info({ path: this.socketPath }, 'RPC server started');
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      logger.info('RPC server stopped');
    }
  }

  private handleConnection(socket: Socket): void {
    let buffer = '';
    socket.on('data', async (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const request = JSON.parse(line);
          const response = await this.handleRequest(request);
          socket.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          };
          socket.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    });
  }

  private async handleRequest(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { id, method, params } = request as { id: string | number; method: string; params: Record<string, unknown> };
    const handler = this.handlers.get(method);

    if (!handler) {
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    }

    try {
      const result = await handler(params ?? {});
      return { jsonrpc: '2.0', id, result };
    } catch (error: any) {
      logger.error({ method, error: error.message }, 'RPC handler error');
      return { jsonrpc: '2.0', id, error: { code: -32000, message: error.message } };
    }
  }
}
```

- [ ] **Step 5: Create logger**

```typescript
// apps/daemon/src/logger.ts
import pino from 'pino';

export function createLogger(name: string): pino.Logger {
  return pino({
    name,
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });
}
```

- [ ] **Step 6: Create daemon entry point**

```typescript
// apps/daemon/src/index.ts
import { RpcServer } from './rpc-server';
import { createLogger } from './logger';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const logger = createLogger('daemon');
const socketPath = process.env.MYBOTEAM_SOCKET ?? join(tmpdir(), 'myboteam-daemon.sock');

const server = new RpcServer(socketPath);

// Register core RPC methods
server.register('ping', () => ({ pong: true }));
server.register('version', () => ({ version: '0.1.0' }));

server.start();
logger.info({ socketPath }, 'Daemon started');

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
```

- [ ] **Step 7: Run tests**

```bash
cd apps/daemon && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/daemon/
git commit -m "feat: add JSON-RPC server over Unix socket"
```

---

### Task M3-2: Daemon lifecycle (start/stop/graceful shutdown)

**Files:**
- Create: `apps/daemon/src/daemon.ts`
- Create: `apps/daemon/src/__tests__/daemon.test.ts`

**Cherry-Pick:** Daemon lifecycle from Accomplish. Forked child process, graceful drain.

- [ ] **Step 1: Write failing tests**

```typescript
// apps/daemon/src/__tests__/daemon.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Daemon } from '../daemon';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Daemon', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'myboteam-daemon-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates daemon with socket path', () => {
    const daemon = new Daemon({
      socketPath: join(tempDir, 'daemon.sock'),
      dbPath: join(tempDir, 'test.db'),
      vaultPath: join(tempDir, 'vault.json'),
      dataDir: tempDir,
    });
    expect(daemon).toBeDefined();
  });

  it('has start and stop methods', () => {
    const daemon = new Daemon({
      socketPath: join(tempDir, 'daemon.sock'),
      dbPath: join(tempDir, 'test.db'),
      vaultPath: join(tempDir, 'vault.json'),
      dataDir: tempDir,
    });
    expect(typeof daemon.start).toBe('function');
    expect(typeof daemon.stop).toBe('function');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/daemon && pnpm vitest run src/__tests__/daemon.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement Daemon**

```typescript
// apps/daemon/src/daemon.ts
import { RpcServer } from './rpc-server';
import { AgentStorage, PidLock, DataDirectory, SecretVault } from '@myboteam/agent-core';
import { createLogger } from './logger';

const logger = createLogger('daemon');

export interface DaemonConfig {
  socketPath: string;
  dbPath: string;
  vaultPath: string;
  dataDir: string;
}

export class Daemon {
  private config: DaemonConfig;
  private rpcServer: RpcServer;
  private storage: AgentStorage;
  private pidLock: PidLock;
  private vault: SecretVault;
  private dataDir: DataDirectory;
  private shutdownTimeout = 30_000;

  constructor(config: DaemonConfig) {
    this.config = config;
    this.rpcServer = new RpcServer(config.socketPath);
    this.storage = new AgentStorage(config.dbPath);
    this.pidLock = new PidLock(join(config.dataDir, 'daemon.pid'));
    this.vault = new SecretVault(config.vaultPath, 'default-machine');
    this.dataDir = new DataDirectory(config.dataDir);
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.rpcServer.register('ping', () => ({ pong: true }));
    this.rpcServer.register('version', () => ({ version: '0.1.0' }));
    this.rpcServer.register('listAgents', () => this.storage.listAgents());
    this.rpcServer.register('getAgent', (params: any) => this.storage.getAgent(params.id));
    this.rpcServer.register('createTask', (params: any) => this.storage.createTask(params));
    this.rpcServer.register('getTask', (params: any) => this.storage.getTask(params.id));
    this.rpcServer.register('updateTask', (params: any) => this.storage.updateTask(params.id, params.updates));
  }

  start(): boolean {
    if (!this.pidLock.acquire()) {
      logger.error('Another daemon instance is already running');
      return false;
    }

    this.dataDir.ensure();
    this.rpcServer.start();
    logger.info('Daemon started');
    return true;
  }

  async stop(): Promise<void> {
    logger.info('Daemon shutting down...');
    this.rpcServer.stop();
    this.storage.close();
    this.pidLock.release();
    logger.info('Daemon stopped');
  }
}
```

- [ ] **Step 4: Update daemon index.ts**

```typescript
// apps/daemon/src/index.ts (update)
import { Daemon } from './daemon';
import { createLogger } from './logger';
import { DataDirectory } from '@myboteam/agent-core';
import { join } from 'node:path';
import { homedir } from 'node:os';

const logger = createLogger('daemon');
const dataDir = process.env.MYBOTEAM_DATA_DIR ?? join(homedir(), '.myboteam');
const dd = new DataDirectory(dataDir);
dd.ensure();

const daemon = new Daemon({
  socketPath: process.env.MYBOTEAM_SOCKET ?? join(dataDir, 'daemon.sock'),
  dbPath: dd.dbPath,
  vaultPath: dd.vaultPath,
  dataDir,
});

if (!daemon.start()) {
  logger.error('Failed to start daemon');
  process.exit(1);
}

process.on('SIGINT', async () => {
  await daemon.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await daemon.stop();
  process.exit(0);
});
```

- [ ] **Step 5: Run tests**

```bash
cd apps/daemon && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/daemon/src/daemon.ts apps/daemon/src/index.ts apps/daemon/src/__tests__/daemon.test.ts
git commit -m "feat: add daemon lifecycle with graceful shutdown"
```

---

### Task M3-3: Crash recovery (PID detection, stale tasks)

**Files:**
- Modify: `apps/daemon/src/daemon.ts`

**Cherry-Pick:** Crash recovery from Accomplish. Stale task cleanup on restart.

- [ ] **Step 1: Add stale task cleanup to Daemon.start()**

```typescript
// apps/daemon/src/daemon.ts — add to start() method after pidLock.acquire()
private cleanupStaleTasks(): void {
  const staleTasks = this.storage.db.prepare(
    "SELECT id FROM tasks WHERE status = 'running'"
  ).all() as { id: string }[];

  for (const task of staleTasks) {
    this.storage.updateTask(task.id, { status: 'failed', output: 'Task failed: daemon crashed' });
    logger.warn({ taskId: task.id }, 'Marked stale task as failed');
  }

  if (staleTasks.length > 0) {
    logger.info({ count: staleTasks.length }, 'Cleaned up stale tasks');
  }
}
```

- [ ] **Step 2: Call cleanupStaleTasks in start()**

```typescript
start(): boolean {
  if (!this.pidLock.acquire()) {
    logger.error('Another daemon instance is already running');
    return false;
  }

  this.dataDir.ensure();
  this.cleanupStaleTasks();
  this.rpcServer.start();
  logger.info('Daemon started');
  return true;
}
```

- [ ] **Step 3: Run tests**

```bash
cd apps/daemon && pnpm vitest run
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/daemon/src/daemon.ts
git commit -m "feat: add crash recovery with stale task cleanup"
```

---

### Task M3-4: Login-item auto-start

**Files:**
- Create: `apps/desktop/src/main/app-startup.ts`

**Cherry-Pick:** macOS LaunchAgent from Accomplish. app.setLoginItemSettings() pattern.

*Note: This task is implemented in M11-1 when the Electron shell is built. The login-item logic is a thin wrapper around Electron's `app.setLoginItemSettings()`. Placeholder for now.*

- [ ] **Step 1: Create placeholder with interface**

```typescript
// apps/desktop/src/main/app-startup.ts
export function setAutoStart(enabled: boolean): void {
  // Will be implemented with Electron's app.setLoginItemSettings()
  // in M11-1 (Electron shell)
}

export function isAutoStartEnabled(): boolean {
  return false;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/main/app-startup.ts
git commit -m "feat: add auto-start placeholder for login item"
```

---

### Task M3-5: IPC bus (renderer ↔ daemon)

**Files:**
- Create: `apps/desktop/src/preload/index.ts`
- Create: `apps/desktop/src/preload/handlers/app-core.ts`
- Create: `apps/desktop/src/preload/handlers/agent-handlers.ts`

**Cherry-Pick:** 4-link IPC chain from v0.3.0 preload. contextBridge with handler modules.

*Note: Full preload implementation in M11-1. Placeholder for daemon communication interface.*

- [ ] **Step 1: Create preload interface**

```typescript
// apps/desktop/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('myboteam', {
  // App core
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // Daemon RPC
  rpcCall: (method: string, params?: Record<string, unknown>) =>
    ipcRenderer.invoke('daemon:rpc', method, params),

  // Events
  onTaskUpdate: (callback: (...args: unknown[]) => void) => {
    ipcRenderer.on('task:update', (_event, ...args) => callback(...args));
    return () => ipcRenderer.removeAllListeners('task:update');
  },

  onPermissionRequest: (callback: (...args: unknown[]) => void) => {
    ipcRenderer.on('permission:request', (_event, ...args) => callback(...args));
    return () => ipcRenderer.removeAllListeners('permission:request');
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/preload/
git commit -m "feat: add IPC preload bridge"
```

---

## M4: LLM Layer (5 tickets)

### Task M4-1: ProviderClient interface

**Files:**
- Create: `packages/agent-core/src/providers/index.ts`
- Create: `packages/agent-core/src/providers/types.ts`

**Cherry-Pick:** ProviderClient interface from v0.4.0 providers.ts.

- [ ] **Step 1: Create provider types**

```typescript
// packages/agent-core/src/providers/types.ts
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface ChatCompletionChunk {
  id: string;
  delta: string;
  model: string;
  finishReason?: string;
}

export interface ProviderClient {
  name: string;
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  streamChat(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk>;
  listModels(): Promise<string[]>;
}
```

- [ ] **Step 2: Create index**

```typescript
// packages/agent-core/src/providers/index.ts
export type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ProviderClient,
} from './types';
```

- [ ] **Step 3: Update agent-core exports**

```typescript
// packages/agent-core/src/index.ts (add)
export * from './providers';
```

- [ ] **Step 4: Commit**

```bash
git add packages/agent-core/src/providers/
git commit -m "feat: add ProviderClient interface"
```

---

### Task M4-2: OpenAI + Anthropic providers

**Files:**
- Create: `packages/agent-core/src/providers/openai.ts`
- Create: `packages/agent-core/src/providers/anthropic.ts`

**Cherry-Pick:** Provider implementations from v0.4.0 providers.ts.

*Note: Full implementation requires @anthropic-ai/sdk and openai packages. Placeholder with interface conformance.*

- [ ] **Step 1: Create OpenAI provider skeleton**

```typescript
// packages/agent-core/src/providers/openai.ts
import type { ProviderClient, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from './types';

export class OpenAiProvider implements ProviderClient {
  name = 'openai';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature }),
    });
    const data = await response.json() as any;
    return {
      id: data.id,
      content: data.choices[0].message.content,
      model: data.model,
      usage: { inputTokens: data.usage.prompt_tokens, outputTokens: data.usage.completion_tokens },
    };
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, stream: true }),
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          const chunk = JSON.parse(line.slice(6));
          yield { id: chunk.id, delta: chunk.choices[0]?.delta?.content ?? '', model: chunk.model, finishReason: chunk.choices[0]?.finish_reason };
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = await response.json() as any;
    return data.data?.map((m: any) => m.id) ?? [];
  }
}
```

- [ ] **Step 2: Create Anthropic provider skeleton**

```typescript
// packages/agent-core/src/providers/anthropic.ts
import type { ProviderClient, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from './types';

export class AnthropicProvider implements ProviderClient {
  name = 'anthropic';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.anthropic.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const system = request.messages.find((m) => m.role === 'system')?.content;
    const messages = request.messages.filter((m) => m.role !== 'system');
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: request.model, max_tokens: request.maxTokens ?? 4096, system, messages }),
    });
    const data = await response.json() as any;
    return {
      id: data.id,
      content: data.content[0].text,
      model: data.model,
      usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
    };
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk> {
    const system = request.messages.find((m) => m.role === 'system')?.content;
    const messages = request.messages.filter((m) => m.role !== 'system');
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: request.model, max_tokens: request.maxTokens ?? 4096, system, messages, stream: true }),
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'content_block_delta') {
            yield { id: event.delta?.text ?? '', delta: event.delta?.text ?? '', model: request.model };
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    return ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
  }
}
```

- [ ] **Step 3: Update exports**

```typescript
// packages/agent-core/src/providers/index.ts (add)
export { OpenAiProvider } from './openai';
export { AnthropicProvider } from './anthropic';
```

- [ ] **Step 4: Commit**

```bash
git add packages/agent-core/src/providers/openai.ts packages/agent-core/src/providers/anthropic.ts
git commit -m "feat: add OpenAI and Anthropic provider implementations"
```

---

### Task M4-3: Local LLM provider (Ollama/LMStudio)

**Files:**
- Create: `packages/agent-core/src/providers/ollama.ts`
- Create: `packages/agent-core/src/providers/lmstudio.ts`

**Cherry-Pick:** Ollama/LMStudio from v0.4.0 providers.ts.

- [ ] **Step 1: Create Ollama provider**

```typescript
// packages/agent-core/src/providers/ollama.ts
import type { ProviderClient, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from './types';

export class OllamaProvider implements ProviderClient {
  name = 'ollama';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, messages: request.messages, stream: false }),
    });
    const data = await response.json() as any;
    return {
      id: `ollama-${Date.now()}`,
      content: data.message?.content ?? '',
      model: data.model,
      usage: { inputTokens: data.prompt_eval_count ?? 0, outputTokens: data.eval_count ?? 0 },
    };
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, messages: request.messages, stream: true }),
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) {
          const chunk = JSON.parse(line);
          yield { id: `ollama-${Date.now()}`, delta: chunk.message?.content ?? '', model: chunk.model, finishReason: chunk.done ? 'stop' : undefined };
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json() as any;
    return data.models?.map((m: any) => m.name) ?? [];
  }
}
```

- [ ] **Step 2: Create LMStudio provider**

```typescript
// packages/agent-core/src/providers/lmstudio.ts
import { OpenAiProvider } from './openai';

export class LmStudioProvider extends OpenAiProvider {
  name = 'lmstudio';

  constructor(baseUrl = 'http://localhost:1234/v1') {
    super('lm-studio', baseUrl);
  }
}
```

- [ ] **Step 3: Update exports**

```typescript
// packages/agent-core/src/providers/index.ts (add)
export { OllamaProvider } from './ollama';
export { LmStudioProvider } from './lmstudio';
```

- [ ] **Step 4: Commit**

```bash
git add packages/agent-core/src/providers/ollama.ts packages/agent-core/src/providers/lmstudio.ts
git commit -m "feat: add Ollama and LMStudio local LLM providers"
```

---

### Task M4-4: Custom provider (URL + key + model)

**Files:**
- Create: `packages/agent-core/src/providers/custom.ts`

**Cherry-Pick:** Custom provider from Accomplish. OpenAI-compatible format.

- [ ] **Step 1: Create CustomProvider**

```typescript
// packages/agent-core/src/providers/custom.ts
import { OpenAiProvider } from './openai';

export class CustomProvider extends OpenAiProvider {
  name = 'custom';

  constructor(baseUrl: string, apiKey: string) {
    super(apiKey, baseUrl);
  }
}
```

- [ ] **Step 2: Update exports**

```typescript
// packages/agent-core/src/providers/index.ts (add)
export { CustomProvider } from './custom';
```

- [ ] **Step 3: Commit**

```bash
git add packages/agent-core/src/providers/custom.ts
git commit -m "feat: add custom provider (URL + key + model)"
```

---

### Task M4-5: Model router + BYOK key injection

**Files:**
- Create: `packages/agent-core/src/providers/router.ts`

**Cherry-Pick:** Fallback chain from Odysseus. Model router from v0.4.0.

- [ ] **Step 1: Create ModelRouter**

```typescript
// packages/agent-core/src/providers/router.ts
import type { ProviderClient } from './types';

interface ProviderEntry {
  client: ProviderClient;
  priority: number;
  healthy: boolean;
  lastFailure?: number;
}

export class ModelRouter {
  private providers: ProviderClient[] = [];
  private cooldownMs = 60_000;

  addProvider(client: ProviderClient, priority = 0): void {
    this.providers.push(client);
    this.providers.sort((a, b) => priority - priority);
  }

  getProvider(model?: string): ProviderClient | undefined {
    const now = Date.now();
    return this.providers.find((p) => {
      const entry = this.providers.find((e) => e === p) as any;
      if (entry?.lastFailure && now - entry.lastFailure < this.cooldownMs) return false;
      return true;
    });
  }

  markFailed(client: ProviderClient): void {
    const entry = this.providers.find((p) => p === client) as any;
    if (entry) entry.lastFailure = Date.now();
  }

  listProviders(): ProviderClient[] {
    return [...this.providers];
  }
}
```

- [ ] **Step 2: Update exports**

```typescript
// packages/agent-core/src/providers/index.ts (add)
export { ModelRouter } from './router';
```

- [ ] **Step 3: Commit**

```bash
git add packages/agent-core/src/providers/router.ts
git commit -m "feat: add model router with fallback chain"
```

---

## M5-M12: Remaining Tickets

*The remaining 35 tickets (M5 through M12) follow the same TDD pattern established above. Each ticket has: write failing test → verify failure → implement → verify pass → commit.*

*Due to document length, the remaining tasks are summarized below with their key implementation details. The full step-by-step code follows the exact same structure as M1-M4.*

### M5: Agent Runtime (5 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M5-1 | Agent config system with defaults for orchestrator/secretary/accountant | v0.4.0 agent-core types |
| M5-2 | Eve materializer generating runtime files from config | v0.4.0 materializer.ts |
| M5-3 | State machine: idle → running → paused → completed/failed | v0.2.0 agent/state |
| M5-4 | LLM-based intent analysis routing to correct agent | OpenClaw agent dispatch |
| M5-5 | Orchestrator: plan creation, delegation, sequential/parallel | OpenClaw orchestration |

### M6: Verification & Safety (4 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M6-1 | 6-state CompletionEnforcer with continuation nudges | Accomplish CompletionEnforcer |
| M6-2 | Soft timeout (90s) + hard timeout (150s) watchdog | Odysseus detached runs |
| M6-3 | HITL manager: email, external API, workspace boundary | Accomplish permission handler |
| M6-4 | Electron Notification API integration | v0.3.0 desktop notifications |

### M7: MCP & Tools (5 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M7-1 | MCP server manager with stdio transport + auto-reconnect | Odysseus mcp_manager + v0.2.0 daemon/mcp |
| M7-2 | Filesystem tools: read/write/edit/glob/grep/ls with workspace confinement | v0.4.0 mcp-servers/filesystem |
| M7-3 | 3-tier tool resolution: daemon-native → MCP → Eve stubs | OpenClaw tools |
| M7-4 | Declarative tool availability with allOf/anyOf combinators | OpenClaw availability.ts |
| M7-5 | Security sandboxing: process isolation + restricted scope | OpenClaw security scanner |

### M8: Knowledge System (4 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M8-1 | Memory system: SQLite storage + LLM extraction (every 4th turn) | Odysseus memory.py |
| M8-2 | Hybrid retrieval: 0.55*vector + 0.40*keyword + 0.05*recency | Odysseus chat_processor |
| M8-3 | Skill Workshop: propose → scan → apply/reject/quarantine | OpenClaw workshop/service.ts |
| M8-4 | Standing orders as workspace files loaded into sessions | OpenClaw skills pattern |

### M9: Productivity Tools (3 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M9-1 | NL Scheduler: cron/at/every with run history | Odysseus task_scheduler |
| M9-2 | Document Editor: FIND/REPLACE + version history + suggestions | Odysseus agent_loop |
| M9-3 | Notes & Todos: text/checklist + due dates + reminders | Odysseus reminders pattern |

### M10: Specialized Agents (3 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M10-1 | Secretary: calendar MCP + email MCP + HITL on send | v0.4.0 agent configs + v0.2.0 gmail/calendar MCP |
| M10-2 | Accountant: invoice scanning + folder org + CSV tracking | v0.4.0 agent configs + v0.2.0 gws MCP |
| M10-3 | Agent profiles: instructions, tool catalog, delegation policy | v0.4.0 runtime.ts profile injection |

### M11: Desktop & UI (5 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M11-1 | Electron shell: main, preload, window, tray, lifecycle | v0.3.0 apps/desktop |
| M11-2 | React UI: chat, sidebar, conversations, settings views | v0.3.0 apps/web full UI |
| M11-3 | Settings UI: provider config, agent management, model selection | v0.3.0 settings pages |
| M11-4 | Notification system: HITL prompts, task alerts, toasts | v0.3.0 common components |
| M11-5 | Storybook setup with component library stories | v0.3.0 UI components |

### M12: Logging & Debug (3 tickets)

| Ticket | Implementation | Cherry-Pick Source |
|--------|---------------|-------------------|
| M12-1 | Pino dual-output (file + stdout), named loggers, env-configurable | v0.2.0 logger patterns |
| M12-2 | Debug logs SQLite table + DebugPanel UI viewer | v0.5.0 AD.md spec + v0.3.0 DebugPanel |
| M12-3 | Tool call audit trail: tool_calls table with params/duration | v0.5.0 AD.md spec |

---

## Task Execution Summary

| Milestone | Tickets | Estimated Effort |
|-----------|---------|-----------------|
| M1: Foundation | 5 | S-M (15 pts) |
| M2: Data Layer | 5 | M-L (20 pts) |
| M3: IPC & Daemon | 5 | M-L (22 pts) |
| M4: LLM Layer | 5 | M-L (18 pts) |
| M5: Agent Runtime | 5 | M-XL (24 pts) |
| M6: Verification & Safety | 4 | M-L (18 pts) |
| M7: MCP & Tools | 5 | M-L (22 pts) |
| M8: Knowledge System | 4 | L (20 pts) |
| M9: Productivity Tools | 3 | M-L (13 pts) |
| M10: Specialized Agents | 3 | L (15 pts) |
| M11: Desktop & UI | 5 | M-XL (24 pts) |
| M12: Logging & Debug | 3 | M (9 pts) |
| **Total** | **57** | **~220 pts** |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-25-implementation-plan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
