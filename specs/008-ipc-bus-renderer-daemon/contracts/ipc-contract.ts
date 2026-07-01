// IPC Contract for Renderer-Daemon Communication
// JSON-RPC 2.0 over Unix domain socket

// Request types
export interface RenderRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "render";
  params: {
    rendererType: string;
    documentData: string; // base64 encoded for binary
    options?: Record<string, any>;
  };
}

export interface PingRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "daemon.ping";
  params?: {};
}

export interface GetPluginsRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "daemon.getPlugins";
  params?: {};
}

// Response types
export interface JsonRpcSuccessResponse<T> {
  jsonrpc: "2.0";
  id: string | number;
  result: T;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JsonRpcResponse<T> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

// Result types
export interface RenderResult {
  output: string; // base64 encoded rendered output
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface PingResult {
  status: "ok";
  uptime: number;
  buildId: string;
}

export interface PluginInfo {
  name: string;
  version: string;
  supportedTypes: string[];
}

export interface GetPluginsResult {
  plugins: PluginInfo[];
}

// Event types (daemon → main → renderer)
export interface DaemonEvent {
  jsonrpc: "2.0";
  method: "event.render.progress";
  params: {
    requestId: string;
    progress: number; // 0-100
    status: "processing" | "completed" | "error";
  };
}

export interface RenderCompleteEvent {
  jsonrpc: "2.0";
  method: "event.render.complete";
  params: {
    requestId: string;
    output: string; // base64 encoded
    mimeType: string;
  };
}

export interface RenderErrorEvent {
  jsonrpc: "2.0";
  method: "event.render.error";
  params: {
    requestId: string;
    error: {
      code: number;
      message: string;
    };
  };
}

// Error codes (standard JSON-RPC)
export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

// Custom error codes
export const RENDERER_NOT_FOUND = -32000;
export const DOCUMENT_TOO_LARGE = -32001;
export const PLUGIN_CRASHED = -32002;
export const DAEMON_SHUTTING_DOWN = -32003;

// Renderer types (built-in)
export const RENDERER_PDF = "pdf";
export const RENDERER_IMAGE = "image";
export const RENDERER_MARKDOWN = "markdown";
export const RENDERER_HTML = "html";
export const RENDERER_PLAIN_TEXT = "plain-text";