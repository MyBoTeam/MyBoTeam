import { state } from './server-state';

export function getServerStatus(): {
  running: boolean;
  port: number | null;
  loadedModel: string | null;
  isLoading: boolean;
} {
  return {
    running: state.server !== null,
    port: state.port,
    loadedModel: state.loadedModelId,
    isLoading: state.isLoading,
  };
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  if (!state.server || !state.port) {
    return { success: false, error: 'Server is not running' };
  }

  try {
    const response = await fetch(`http://127.0.0.1:${state.port}/health`);
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: `Health check failed with status ${response.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
  }
}
