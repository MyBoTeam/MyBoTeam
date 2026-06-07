import type http from 'node:http';
import type { ChatCompletionRequest } from './server-state';

export function readBody(
  req: http.IncomingMessage,
  limitBytes = 10 * 1024 * 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    let overLimit = false;

    req.on('data', (chunk: Buffer) => {
      if (overLimit) return;
      size += chunk.length;
      if (size > limitBytes) {
        overLimit = true;
        reject(new Error('PayloadTooLarge'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (!overLimit) {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      }
    });
    req.on('error', reject);
  });
}

export function writeJsonError(
  res: http.ServerResponse,
  status: number,
  message: string,
  type = 'invalid_request_error',
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message, type } }));
}

export function validateSamplingParams(
  chatReq: ChatCompletionRequest,
  res: http.ServerResponse,
): boolean {
  const maxTokens = chatReq.max_tokens ?? 512;
  const temperature = chatReq.temperature ?? 0.7;
  const topP = chatReq.top_p ?? 0.9;

  if (!Number.isFinite(maxTokens) || maxTokens < 1 || maxTokens > 32768) {
    writeJsonError(res, 400, 'max_tokens must be between 1 and 32768');
    return false;
  }
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
    writeJsonError(res, 400, 'temperature must be between 0 and 2');
    return false;
  }
  if (!Number.isFinite(topP) || topP <= 0 || topP > 1) {
    writeJsonError(res, 400, 'top_p must be between 0 and 1');
    return false;
  }
  return true;
}

export function setCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse): void {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
