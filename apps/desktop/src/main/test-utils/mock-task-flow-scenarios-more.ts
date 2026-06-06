import type { TaskMessage } from '@myboteam/agent-core/desktop-main';
import { createMessageId } from '@myboteam/agent-core/desktop-main';
import type { MockEventSender } from './mock-task-flow-types';

interface ScenarioStorage {
  addTaskMessage(taskId: string, message: TaskMessage): void;
  updateTaskStatus(taskId: string, status: string, timestamp: string): void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function executeErrorScenario(
  sendEvent: MockEventSender,
  storage: ScenarioStorage,
  taskId: string,
): void {
  storage.updateTaskStatus(taskId, 'failed', new Date().toISOString());

  sendEvent('task:update', {
    taskId,
    type: 'error',
    error: 'Command execution failed: File not found',
  });
}

export async function executeInterruptedScenario(
  sendEvent: MockEventSender,
  sendMessage: (message: TaskMessage) => void,
  storage: ScenarioStorage,
  taskId: string,
  delayMs: number,
): Promise<void> {
  sendMessage({
    id: createMessageId(),
    type: 'assistant',
    content: 'Task was interrupted by user.',
    timestamp: new Date().toISOString(),
  });
  await sleep(delayMs);

  storage.updateTaskStatus(taskId, 'interrupted', new Date().toISOString());

  sendEvent('task:update', {
    taskId,
    type: 'complete',
    result: { status: 'interrupted', sessionId: `session_${taskId}` },
  });
}

export async function executeCodeBlockScenario(
  sendEvent: MockEventSender,
  sendMessage: (message: TaskMessage) => void,
  storage: ScenarioStorage,
  taskId: string,
  delayMs: number,
): Promise<void> {
  const codeContent = `Here's an example function:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
\`\`\`

And here's another example in Python:

\`\`\`python
def calculate_sum(numbers):
    return sum(numbers)

result = calculate_sum([1, 2, 3, 4, 5])
print(f"Sum: {result}")
\`\`\`

The code blocks above demonstrate syntax highlighting.`;

  sendMessage({
    id: createMessageId(),
    type: 'assistant',
    content: codeContent,
    timestamp: new Date().toISOString(),
  });
  await sleep(delayMs);

  storage.updateTaskStatus(taskId, 'completed', new Date().toISOString());

  sendEvent('task:update', {
    taskId,
    type: 'complete',
    result: { status: 'success', sessionId: `session_${taskId}` },
  });
}
