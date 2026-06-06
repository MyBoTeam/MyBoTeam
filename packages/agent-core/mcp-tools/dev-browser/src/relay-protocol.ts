import type { WSContext } from 'hono/ws';

export interface RelayOptions {
  port?: number;
  host?: string;
}

export interface RelayServer {
  wsEndpoint: string;
  port: number;
  stop(): Promise<void>;
}

export interface TargetInfo {
  targetId: string;
  type: string;
  title: string;
  url: string;
  attached: boolean;
}

export interface ConnectedTarget {
  sessionId: string;
  targetId: string;
  targetInfo: TargetInfo;
}

export interface PlaywrightClient {
  id: string;
  ws: WSContext;
  knownTargets: Set<string>;
}

export interface _ExtensionCommandMessage {
  id: number;
  method: 'forwardCDPCommand';
  params: { method: string; params?: Record<string, unknown>; sessionId?: string };
}

export interface ExtensionResponseMessage {
  id: number;
  result?: unknown;
  error?: string;
}

export interface ExtensionEventMessage {
  method: 'forwardCDPEvent';
  params: { method: string; params?: Record<string, unknown>; sessionId?: string };
}

export type ExtensionMessage =
  | ExtensionResponseMessage
  | ExtensionEventMessage
  | { method: 'log'; params: { level: string; args: string[] } };

export interface CDPCommand {
  id: number;
  method: string;
  params?: Record<string, unknown>;
  sessionId?: string;
}

export interface CDPResponse {
  id: number;
  sessionId?: string;
  result?: unknown;
  error?: { message: string };
}

export interface CDPEvent {
  method: string;
  sessionId?: string;
  params?: Record<string, unknown>;
}

export interface RelayContext {
  connectedTargets: Map<string, ConnectedTarget>;
  namedPages: Map<string, string>;
  playwrightClients: Map<string, PlaywrightClient>;
  extensionWs: { current: WSContext | null };
  extensionPendingRequests: Map<
    number,
    { resolve: (result: unknown) => void; reject: (error: Error) => void }
  >;
  extensionMessageId: { current: number };
  log: (...args: unknown[]) => void;
}
