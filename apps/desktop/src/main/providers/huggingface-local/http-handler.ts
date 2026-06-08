import type http from 'node:http';
import { getLogCollector } from '../../logging';
import { handleChatCompletion, handleStreamingCompletion } from './chat-completions';
import { readBody, setCorsHeaders, writeJsonError } from './request-helpers';
import { type ChatCompletionRequest, state } from './server-state';

export function createRequestHandler(): (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => Promise<void> {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '';

    try {
      if (req.method === 'GET' && url === '/v1/models') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            object: 'list',
            data: state.loadedModelId
              ? [
                  {
                    id: state.loadedModelId,
                    object: 'model',
                    created: Math.floor(Date.now() / 1000),
                    owned_by: 'huggingface-local',
                  },
                ]
              : [],
          }),
        );
        return;
      }

      if (req.method === 'POST' && url === '/v1/chat/completions') {
        if (state.isLoading) {
          writeJsonError(res, 503, 'Model is loading, please wait', 'server_error');
          return;
        }

        if (!state.model || !state.tokenizer) {
          writeJsonError(res, 503, 'No model loaded', 'server_error');
          return;
        }

        const body = await readBody(req);
        let chatReq: ChatCompletionRequest;
        try {
          chatReq = JSON.parse(body);
        } catch {
          writeJsonError(res, 400, 'Invalid JSON in request body');
          return;
        }

        if (!Array.isArray(chatReq.messages) || chatReq.messages.length === 0) {
          writeJsonError(res, 400, 'messages must be a non-empty array');
          return;
        }

        for (const message of chatReq.messages) {
          const msg = message as unknown as Record<string, unknown>;
          if (
            !message ||
            msg.role === undefined ||
            msg.content === undefined ||
            typeof message.content !== 'string' ||
            !['system', 'user', 'assistant'].includes(message.role)
          ) {
            writeJsonError(res, 400, 'Invalid message format');
            return;
          }
        }

        if (chatReq.stream) {
          await handleStreamingCompletion(chatReq, res);
        } else {
          await handleChatCompletion(chatReq, res);
        }
        return;
      }

      if (req.method === 'GET' && (url === '/health' || url === '/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            model: state.loadedModelId,
            isLoading: state.isLoading,
          }),
        );
        return;
      }

      writeJsonError(res, 404, 'Not found', 'invalid_request');
    } catch (error: unknown) {
      getLogCollector().logEnv('ERROR', '[HF Server] Request error:', { error: String(error) });

      if (error instanceof Error && error.message === 'PayloadTooLarge') {
        if (!res.headersSent) {
          writeJsonError(res, 413, 'Request entity too large');
        }
        return;
      }

      if (!res.writableEnded) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({
            error: {
              message: error instanceof Error ? error.message : 'Internal server error',
              type: 'server_error',
            },
          }),
        );
      }
    }
  };
}
