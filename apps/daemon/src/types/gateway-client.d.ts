/**
 * Ambient module declaration for the optional private gateway client package.
 *
 * This allows TypeScript to resolve `import('@myboteam/llm-gateway-client')`
 * even when the package isn't installed (OSS builds). The real package
 * provides its own types when installed in Free builds.
 */
declare module '@myboteam/llm-gateway-client' {
  import type { MyboteamRuntime } from '@myboteam/agent-core';
  export function createRuntime(): MyboteamRuntime;
}
