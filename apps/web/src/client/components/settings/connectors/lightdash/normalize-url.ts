export function normalizeLightdashUrl(input: string): string {
  let url = input.trim();
  if (!url) {
    return url;
  }

  if (!url.includes('.') && !url.includes('://')) {
    return `https://${url}.lightdash.cloud/api/v1/mcp`;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return input.trim();
    }
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    const pathWithMcp = normalizedPath.endsWith('/api/v1/mcp')
      ? normalizedPath
      : `${normalizedPath}/api/v1/mcp`;
    parsed.pathname = pathWithMcp.startsWith('/') ? pathWithMcp : `/${pathWithMcp}`;
    url = parsed.toString();
  } catch {}

  return url;
}
