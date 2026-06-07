export interface BrowserFramePayload {
  frame: string;

  pageName: string;

  timestamp: number;

  taskId?: string;
}

export interface BrowserStatusPayload {
  status: 'idle' | 'starting' | 'streaming' | 'stopping' | 'error';
  error?: string;
  taskId?: string;
  pageName?: string;
}

export interface BrowserNavigatePayload {
  url: string;
  taskId?: string;
  pageName?: string;
}
