declare module '@myboteam/llm-gateway-client' {
  import type { MyboteamRuntime } from '@myboteam/agent-core';
  export function createRuntime(): MyboteamRuntime;
}
