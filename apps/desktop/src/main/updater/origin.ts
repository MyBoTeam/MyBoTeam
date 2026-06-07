export function isSameApex(candidate: string, reference: string): boolean {
  let candidateUrl: URL;
  let referenceUrl: URL;
  try {
    candidateUrl = new URL(candidate);
    referenceUrl = new URL(reference);
  } catch {
    return false;
  }

  if (candidateUrl.protocol !== referenceUrl.protocol) {
    return false;
  }
  const candidateHost = candidateUrl.hostname;
  const referenceHost = referenceUrl.hostname;

  if (isIpLiteral(referenceHost) || isIpLiteral(candidateHost)) {
    return candidateHost === referenceHost;
  }
  const apex = getApex(referenceHost);
  return candidateHost === apex || candidateHost.endsWith(`.${apex}`);
}

export function isTrustedManifestPath(candidate: string, feedUrl: string): boolean {
  const value = candidate.trim();
  if (!value) {
    return false;
  }

  if (value.startsWith('//')) {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    return isSameApex(value, feedUrl);
  } catch {
    return true;
  }
}

export function isTrustedUpdateInfo(
  info: {
    path?: unknown;
    files?: unknown;
  },
  feedUrl: string,
): boolean {
  const candidates: string[] = [];
  if (typeof info.path === 'string') {
    candidates.push(info.path);
  }
  if (Array.isArray(info.files)) {
    for (const file of info.files) {
      if (file && typeof file === 'object') {
        const url = (file as { url?: unknown }).url;
        if (typeof url === 'string') {
          candidates.push(url);
        }
      }
    }
  }
  return candidates.every((candidate) => isTrustedManifestPath(candidate, feedUrl));
}

function isIpLiteral(host: string): boolean {
  return host.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function getApex(hostname: string): string {
  const labels = hostname.split('.');
  if (labels.length <= 2) {
    return hostname;
  }
  return labels.slice(-2).join('.');
}
