# Remove Explicit `any` Types

**Date:** 2026-06-07
**Status:** Approved by user

## Goal

Remove all explicit `any` type annotations across all source workspaces and enforce the `noExplicitAny` Biome rule as error.

## Strategy (Approach C — Hybrid)

Group `any` occurrences by pattern and apply the appropriate fix:

| Group | Strategy |
|---|---|
| Well-understood patterns (JSON-RPC, IPC handlers, event emitters) | Replace with specific types (`unknown`, `boolean`, proper interfaces) |
| Library boundaries (baileys, `@huggingface/transformers`, onnxruntime) | Create inline type stubs matching actual API shapes used |
| Error handlers (`catch (error: any)`) | Replace with `catch (error: unknown)` |
| Zod schemas (`z.any()`) | Replace with `z.unknown()` |
| Runtime type-narrowing functions | Replace with `unknown` + safe access patterns |
| Disjoint union casts (`providerId as any`) | Use `as` with proper target type or add missing value to union |

## All `any` Occurrences and Fixes

### A. `packages/agent-core/src/`

| File:Line | Current | Fix |
|---|---|---|
| `daemon/rpc-message-handler.ts:4` | `(params: any) => Promise<unknown> \| unknown` | `(params: unknown) => Promise<unknown> \| unknown` |
| `daemon/rpc-message-handler.ts:9` | `write: (data: string) => any` | `write: (data: string) => boolean` |
| `daemon/rpc-server.ts:53` | `notify(method: string, params: any)` | `notify(method: string, params: unknown)` |
| `internal/classes/adapter-config.ts:47` | `(...args: any[]) => void` | `(...args: unknown[]) => void` |
| `common/schemas/validation.ts:18` | `z.record(z.string(), z.any())` | `z.record(z.string(), z.unknown())` |

### B. `apps/desktop/src/main/`

#### HuggingFace Local (inline type stubs required)

**`server-state.ts`** — Replace `any` with typed interfaces:

```typescript
interface HF tokenizer:
  - callable: (text: string, opts?: Record<string, unknown>) => { input_ids: { dims?: number[] }; [key: string]: unknown }
  - .decode(tokens, opts?) => string
  - .apply_chat_template(messages, opts?) => string

interface HF model (CausalLM):
  - .generate(opts: { max_new_tokens, temperature, top_p, do_sample, ...inputs, callback_function? }) => Promise<tensor>
  - .dispose?.() => void
```

| File:Line | Current | Fix |
|---|---|---|
| `server-state.ts:23` | `tokenizer: (((...args: any[]) => any) & Record<string, any>) \| null` | Typed `HfTokenizer \| null` |
| `server-state.ts:25` | `model: Record<string, any> \| null` | Typed `HfPreTrainedModel \| null` |
| `chat-completions.ts:112` | `(output: any) =>` | Type based on usage: tensor-like object with `.slice()` |

**`model-loader.ts`** — Replace `env as any`, `model: any`, `dtype as any`, `tokenizer: any`:

| File:Line | Current | Fix |
|---|---|---|
| `model-loader.ts:53` | `const envAny = env as any` | Use proper `env.backends.onnx` access; cast sub-property if needed |
| `model-loader.ts:64` | `let model: any` | `let model: HfPreTrainedModel \| undefined` |
| `model-loader.ts:68` | `dtype: dtype as any` | Use typed `dtype` from `PretrainedModelOptions` — `dtype: dtype as HfDtype` |
| `model-loader.ts:131` | `tokenizer: any` | `tokenizer: HfTokenizer` |

**`http-handler.ts`** — Replace runtime validation casts:

| File:Line | Current | Fix |
|---|---|---|
| `http-handler.ts:74-75` | `(message as any).role` / `(message as any).content` | Use `(message as Record<string, unknown>).role` with null check |
| `http-handler.ts:105` | `catch (error: any)` | `catch (error: unknown)` |

**`server-lifecycle.ts:111-112`** — Replace `(srv as any).closeAllConnections()`:

| File:Line | Current | Fix |
|---|---|---|
| `server-lifecycle.ts:111-112` | `(srv as any).closeAllConnections` | Type assertion as `typeof srv & { closeAllConnections: () => void }` |

#### IPC Handlers

| File:Line | Current | Fix |
|---|---|---|
| `analytics-utils.ts:24` | `(event: any, ...args: any[])` | `(event: IpcMainInvokeEvent, ...args: unknown[])` |
| `analytics-utils.ts:27` | `(event: any, ...args: any[])` | `(event: IpcMainInvokeEvent, ...args: unknown[])` |
| `cloud-browser-handlers.ts:61` | `cfg as any` | `cfg as Record<string, unknown>` (already typed) |
| `api-key-validation-types.ts:12` | `Record<string, any>` | `Record<string, unknown>` |
| `api-key-validation-handlers.ts:56` | `Record<string, any>` | `Record<string, unknown>` |

### C. `apps/daemon/src/whatsapp/`

All are baileys library boundary — create inline type stubs in a `baileys-types.ts` file:

```typescript
interface BaileysSocket {
  ev: BaileysEventEmitter;
  user?: { id?: string; lid?: string };
  sendMessage(jid: string, content: { text: string }): Promise<{ key?: { id?: string } }>;
  end(error: Error): void;
  logout(): Promise<void>;
}

interface BaileysEventEmitter {
  on(event: 'creds.update', handler: () => void): void;
  on(event: 'connection.update', handler: (update: ConnectionUpdateArgs) => void): void;
  on(event: 'messages.upsert', handler: (upsert: { type: string; messages: unknown[] }) => void): void;
  removeAllListeners(event?: string): void;
}

interface BaileysStore {
  bind(ev: BaileysEventEmitter): void;
  chats: { all(): BaileysChat[] };
  messages: Record<string, { all(): BaileysMessage[] }>;
}
```

| File:Line | Current | Fix |
|---|---|---|
| `whatsapp-service-init.ts:25` | `(baileys as any).makeInMemoryStore` | `(baileys as Record<string, unknown>).makeInMemoryStore` |
| `whatsapp-service-init.ts:51` | `let store: any` | `let store: BaileysStore \| null` |
| `whatsapp-service-init.ts:53` | `makeInMemoryStore({}) as any` | `makeInMemoryStore({}) as BaileysStore` |
| `whatsapp-service-init.ts:62` | `socket: any` | `socket: BaileysSocket` |
| `whatsapp-service-init.ts:64` | `DisconnectReason: any` | `DisconnectReason: Record<string, number>` (matching usage) |
| `whatsapp-session.ts:34` | `socket: any \| null` | `socket: BaileysSocket \| null` |
| `WhatsAppService.ts:22` | `private socket: any \| null` | `private socket: BaileysSocket \| null` |
| `WhatsAppService.ts:23` | `private store: any \| null` | `private store: BaileysStore \| null` |
| `WhatsAppService.ts:141` | `const chats: any[]` | `const chats: BaileysChat[]` |
| `WhatsAppService.ts:150` | `const msgs: any[]` | `const msgs: BaileysMessage[]` |

### D. `apps/web/src/client/`

| File:Line | Current | Fix |
|---|---|---|
| `useApiKeyConnect.ts:137` | `providerId as any` | The issue is `ProviderId` (agent-core) vs `ProviderUnion` (web-local) are different union types. Best fix: add the missing values from `ProviderUnion` into `ProviderType` (agent-core) and re-export, or cast to `addApiKey`'s `ProviderUnion` parameter type. |

## Biome Config Changes

1. Add `"noExplicitAny": "error"` to `linter.rules.suspicious` at the top level
2. Remove `"noExplicitAny": "off"` from all non-test override sections.
   Keep it `"off"` for test globs:
   - `**/__tests__/**`
   - `apps/desktop/src/main/**/*.ts` and `apps/desktop/src/preload/**/*.ts`
   - `apps/daemon/**`
   - `packages/agent-core/mcp-tools/**`
   - `apps/web/src/client/**`
   - `packages/agent-core/src/**`

## Verification

After all changes:
```
pnpm check          # Biome check + typecheck across all workspaces
pnpm -F @myboteam/agent-core test
pnpm -F @myboteam/desktop test
pnpm -F @myboteam/web test
```
