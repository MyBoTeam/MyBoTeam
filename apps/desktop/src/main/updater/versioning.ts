import { load as yamlLoad } from 'js-yaml';
import { coerce, gt as semverGt, valid } from 'semver';

export interface ManifestShape {
  version: string;
  path: string;
}

export function parseManifest(raw: string): ManifestShape | null {
  let doc: unknown;
  try {
    doc = yamlLoad(raw);
  } catch {
    return null;
  }
  if (!doc || typeof doc !== 'object') {
    return null;
  }
  const { version, path: p } = doc as Record<string, unknown>;
  if (typeof version !== 'string' || typeof p !== 'string') {
    return null;
  }
  return { version, path: p };
}

export function normalizeVersion(v: string): string | null {
  return valid(v) ?? coerce(v)?.version ?? null;
}

export function isNewer(remote: string, current: string): boolean {
  const r = normalizeVersion(remote);
  const c = normalizeVersion(current);
  if (!r || !c) {
    return false;
  }
  try {
    return semverGt(r, c);
  } catch {
    return false;
  }
}
