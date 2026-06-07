import type { Part as OpenCodeSdkPart } from '@opencode-ai/sdk/v2';
import type { OpenCodeMessage } from '../../common/types/opencode.js';

export function partToOpenCodeMessage(part: OpenCodeSdkPart): OpenCodeMessage | null {
  const asAny = part as unknown as {
    id?: string;
    sessionID?: string;
    messageID?: string;
    type?: string;
    text?: string;
    tool?: string;
    state?: { status?: string; input?: unknown; output?: string };
  };

  if (part.type === 'text') {
    const text = asAny.text ?? '';
    return {
      type: 'text',
      part: {
        id: asAny.id ?? '',
        sessionID: asAny.sessionID ?? '',
        messageID: asAny.messageID ?? '',
        type: 'text',
        text,
      },
    } as OpenCodeMessage;
  }

  if (part.type === 'tool') {
    const rawStatus = asAny.state?.status;
    const status: 'pending' | 'running' | 'completed' | 'error' =
      rawStatus === 'running' ||
      rawStatus === 'completed' ||
      rawStatus === 'error' ||
      rawStatus === 'pending'
        ? rawStatus
        : 'pending';
    return {
      type: 'tool_use',
      part: {
        id: asAny.id ?? '',
        sessionID: asAny.sessionID ?? '',
        messageID: asAny.messageID ?? '',
        type: 'tool',
        tool: asAny.tool ?? 'unknown',
        state: {
          status,
          input: asAny.state?.input,
          output: asAny.state?.output,
        },
      },
    };
  }

  return null;
}
