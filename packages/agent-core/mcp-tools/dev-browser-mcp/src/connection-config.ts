export type ConnectionMode = 'builtin' | 'remote';

export interface BuiltinConnectionConfig {
  mode: 'builtin';
  devBrowserUrl: string;
  taskId: string;
  cdpHeaders?: never;
  cdpEndpoint?: never;
}

export interface RemoteConnectionConfig {
  mode: 'remote';
  cdpEndpoint: string;
  cdpHeaders?: Record<string, string>;
  taskId: string;
  devBrowserUrl?: never;
}

export type ConnectionConfig = BuiltinConnectionConfig | RemoteConnectionConfig;
