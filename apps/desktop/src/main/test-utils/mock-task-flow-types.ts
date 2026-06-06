export type MockScenario =
  | 'success'
  | 'with-tool'
  | 'permission-required'
  | 'question'
  | 'error'
  | 'interrupted'
  | 'code-block';

export interface MockTaskConfig {
  taskId: string;
  prompt: string;
  scenario: MockScenario;
  delayMs?: number;
}

export type MockEventSender = (channel: string, data: unknown) => void;
