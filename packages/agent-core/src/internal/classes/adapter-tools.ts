import type { ToolPart } from '@opencode-ai/sdk/v2';
import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { AdapterState } from './adapter-state.js';
import { partToOpenCodeMessage as toMessage } from './adapter-utils.js';

export function handleToolPart(
  state: AdapterState,
  part: ToolPart,
  onAuthMarker: (text: string) => void,
): void {
  const toolPart = part;
  const toolName = toolPart.tool ?? 'unknown';
  const toolState = (toolPart as { state?: { status?: string; input?: unknown; output?: string } })
    .state;
  const status = toolState?.status;

  if (status === 'running') {
    state.emit('tool-use', toolName, toolState?.input);
  } else if (status === 'completed' || status === 'error') {
    const output = toolState?.output ?? '';
    state.emit('tool-result', output);
    state.emit('tool-call-complete', {
      toolName,
      toolInput: toolState?.input,
      toolOutput: output,
      sessionId: state.currentSessionId ?? undefined,
    });

    if (toolName === 'dev-browser-mcp' || toolName.endsWith('_dev-browser-mcp')) {
      detectBrowserFrames(state, output);
    }
  }

  if (status === 'running' || status === 'completed' || status === 'error') {
    const callId = (toolPart as { id?: string }).id;
    const alreadyCounted = callId ? state.countedToolCallIds.has(callId) : false;
    const isTerminal = status === 'completed' || status === 'error';
    const isCompleteTask = toolName === 'complete_task';

    if (!alreadyCounted) {
      if (isCompleteTask && !isTerminal) {
      } else {
        if (callId) state.countedToolCallIds.add(callId);
        if (isCompleteTask && toolState?.input !== undefined) {
          state.completionEnforcer?.handleCompleteTaskDetection(toolState.input);
        } else if (toolName === 'start_task') {
          state.completionEnforcer?.markTaskRequiresCompletion();
        } else {
          state.completionEnforcer?.markToolsUsed(true);
        }
      }
    }
  }

  const synthetic = toMessage(part);
  if (synthetic) {
    state.emit('message', synthetic);
  }

  if (toolState?.output) {
    onAuthMarker(toolState.output);
  }
}

export function detectBrowserFrames(state: AdapterState, output: string): void {
  if (!output) return;
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{') || !trimmed.includes('"type":"browser-frame"')) continue;
    const fingerprint = trimmed.slice(0, 64);
    if (state.browserFrameSeen.has(fingerprint)) continue;
    state.browserFrameSeen.add(fingerprint);
    try {
      const payload = JSON.parse(trimmed) as BrowserFramePayload & { type?: string };
      if (payload.type === 'browser-frame') {
        state.emit('browser-frame', payload);
      }
    } catch {}
  }
}
