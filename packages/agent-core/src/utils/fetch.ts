import { getProxyForUrl } from 'proxy-from-env';
import { type Dispatcher, ProxyAgent } from 'undici';

const proxyDispatcherCache = new Map<string, ProxyAgent>();

function getProxyDispatcher(url: string): Dispatcher | undefined {
  const proxyUrl = getProxyForUrl(url);
  if (!proxyUrl) {
    return undefined;
  }
  let dispatcher = proxyDispatcherCache.get(proxyUrl);
  if (!dispatcher) {
    dispatcher = new ProxyAgent(proxyUrl);
    proxyDispatcherCache.set(proxyUrl, dispatcher);
  }
  return dispatcher;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const proxyDispatcher = getProxyDispatcher(url);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,

      ...(proxyDispatcher ? ({ dispatcher: proxyDispatcher } as unknown as RequestInit) : {}),
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
