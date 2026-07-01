export interface RenderingRequest {
  id: string;
  type: string;
  data: unknown;
  options?: RenderingOptions;
  createdAt: number;
}

export interface RenderingOptions {
  quality?: number;
  format?: string;
  width?: number;
  height?: number;
  timeout?: number;
}

export interface RenderingResult {
  requestId: string;
  success: boolean;
  content?: unknown;
  error?: string;
  durationMs: number;
  timestamp: number;
}

export function createRenderingRequest(
  type: string,
  data: unknown,
  options?: RenderingOptions,
): RenderingRequest {
  return {
    id: generateRequestId(),
    type,
    data,
    options,
    createdAt: Date.now(),
  };
}

export function createRenderingResult(
  requestId: string,
  success: boolean,
  content?: unknown,
  error?: string,
  durationMs = 0,
): RenderingResult {
  return {
    requestId,
    success,
    content,
    error,
    durationMs,
    timestamp: Date.now(),
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
