/**
 * Narrow type-only entrypoint for @myboteam/llm-gateway-client.
 *
 * The private gateway client package imports types from agent-core for
 * the MyboteamRuntime interface. This entrypoint re-exports ONLY the
 * types needed — it does NOT pull in storage, database, or validation
 * modules that would require database/storage at type-resolution time.
 *
 * Usage in llm-gateway-client:
 *   import type { MyboteamRuntime } from '@myboteam/agent-core/runtime-types';
 *
 * Exposed via package.json exports:
 *   "./runtime-types": "./dist/myboteam-runtime-types.js"
 */

export type { CreditUsage } from './common/types/gateway.js';
export type { ProviderBuildResult } from './opencode/config-provider-context.js';
export type {
  MyboteamConnectResult,
  MyboteamRuntime,
  StorageDeps,
} from './opencode/myboteam-runtime.js';
