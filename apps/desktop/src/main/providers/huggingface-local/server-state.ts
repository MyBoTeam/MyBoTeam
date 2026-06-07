import type http from 'node:http';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface ServerState {
  server: http.Server | null;
  port: number | null;
  loadedModelId: string | null;
  pipeline: unknown;

  tokenizer: (((...args: any[]) => any) & Record<string, any>) | null;

  model: Record<string, any> | null;
  isLoading: boolean;

  isStopping: boolean;
}

export const state: ServerState = {
  server: null,
  port: null,
  loadedModelId: null,
  pipeline: null,
  tokenizer: null,
  model: null,
  isLoading: false,
  isStopping: false,
};

export let loadModelPromise: Promise<void> | null = null;
export function setLoadModelPromise(p: Promise<void> | null): void {
  loadModelPromise = p;
}

export let startServerPromise: Promise<{ success: boolean; port?: number; error?: string }> | null =
  null;
export function setStartServerPromise(
  p: Promise<{ success: boolean; port?: number; error?: string }> | null,
): void {
  startServerPromise = p;
}

export let activeGenerations = 0;
export function incrementGenerations(): void {
  activeGenerations++;
}
export function decrementGenerations(): void {
  activeGenerations--;
}
