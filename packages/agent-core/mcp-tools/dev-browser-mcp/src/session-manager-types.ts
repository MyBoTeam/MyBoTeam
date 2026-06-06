import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Page } from 'playwright';
import type { getPage } from './connection.js';
import { getAISnapshot } from './snapshot-manager.js';

type GetAISnapshotFn = (page: Page, options?: Record<string, unknown>) => Promise<string>;

export interface ToolDebug {
  getAISnapshot?: GetAISnapshotFn;
  handlePreAction?(
    name: string,
    args: unknown,
    context: { getPage: typeof getPage; getAISnapshot: GetAISnapshotFn },
  ): Promise<unknown>;
  handlePostAction?(
    name: string,
    args: unknown,
    result: CallToolResult,
    preCapture: unknown,
    context: { getPage: typeof getPage; getAISnapshot: GetAISnapshotFn },
  ): Promise<CallToolResult>;
}
