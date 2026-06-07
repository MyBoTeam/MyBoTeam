import http from 'node:http';
import { getDaemonClient } from '../../daemon-bootstrap';
import { getLogCollector } from '../../logging';
import { createRequestHandler } from './http-handler';
import { loadModel } from './model-loader';
import {
  activeGenerations,
  loadModelPromise,
  setStartServerPromise,
  startServerPromise,
  state,
} from './server-state';

export async function startServer(
  modelId: string,
): Promise<{ success: boolean; port?: number; error?: string }> {
  if (startServerPromise) {
    await startServerPromise;
    if (state.loadedModelId === modelId && state.port !== null) {
      return { success: true, port: state.port };
    }
    return startServer(modelId);
  }
  const promise = _startServerImpl(modelId).finally(() => {
    setStartServerPromise(null);
  });
  setStartServerPromise(promise);
  return promise;
}

async function _startServerImpl(
  modelId: string,
): Promise<{ success: boolean; port?: number; error?: string }> {
  if (state.server) {
    try {
      await loadModel(modelId);
      return { success: true, port: state.port! };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'Server stopped during model load' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load model',
      };
    }
  }

  try {
    await loadModel(modelId);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, error: 'Server stopped during model load' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load model',
    };
  }

  return new Promise((resolve) => {
    const server = http.createServer(createRequestHandler());

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        state.server = server;
        state.port = address.port;
        getLogCollector().logEnv(
          'INFO',
          `[HF Server] Listening on http://127.0.0.1:${address.port}`,
        );

        void (async () => {
          try {
            const client = getDaemonClient();
            const existingConfig = await client.call('provider.getHuggingFaceLocalConfig');
            if (existingConfig) {
              await client.call('provider.setHuggingFaceLocalConfig', {
                config: { ...existingConfig, serverPort: address.port },
              });
            }
          } catch (err) {
            getLogCollector().logEnv('WARN', '[HF Server] Failed to persist port to config:', {
              error: String(err),
            });
          }
        })();
        resolve({ success: true, port: address.port });
      } else {
        resolve({ success: false, error: 'Failed to get server address' });
      }
    });

    server.on('error', (error) => {
      getLogCollector().logEnv('ERROR', '[HF Server] Server error:', { error: String(error) });
      resolve({ success: false, error: error.message });
    });
  });
}

export async function stopServer(): Promise<void> {
  state.isStopping = true;

  const pendingLoad = loadModelPromise;

  if (state.server) {
    await new Promise<void>((resolve) => {
      const srv = state.server!;

      const srvWithClose = srv as typeof srv & { closeAllConnections: () => void };
      if ('closeAllConnections' in srv && typeof srvWithClose.closeAllConnections === 'function') {
        srvWithClose.closeAllConnections();
      }
      srv.close(() => {
        getLogCollector().logEnv('INFO', '[HF Server] Server stopped');
        resolve();
      });
    });
  }

  const drainStart = Date.now();
  while (activeGenerations > 0 && Date.now() - drainStart < 10000) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (state.model) {
    try {
      await state.model.dispose?.();
    } catch {}
  }

  state.server = null;
  state.port = null;
  state.loadedModelId = null;
  state.pipeline = null;
  state.tokenizer = null;
  state.model = null;
  state.isLoading = false;

  if (pendingLoad) {
    await pendingLoad.catch(() => {});
  }
  state.isStopping = false;
}
