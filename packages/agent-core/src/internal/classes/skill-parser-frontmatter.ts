import matter from 'gray-matter';
import type { SkillFrontmatter, SkillSource } from '../../common/types/skills.js';

export function parseFrontmatter(content: string): SkillFrontmatter {
  try {
    const { data } = matter(content);
    return {
      name: data.name || '',
      description: data.description || '',
      command: data.command,
      verified: data.verified,
      hidden: data.hidden,
    };
  } catch {
    return { name: '', description: '' };
  }
}

/**
 * Canonical slug normalizer — single source of truth used by generateId,
 * sanitizeSkillName, and scanDirectory so IDs are stable across scan / import / resync.
 */
export function normalizeSkillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.\./g, '') // strip path-traversal sequences
    .replace(/[/\\]/g, '-') // forward/back-slash → dash
    .replace(/[^a-z0-9-]/g, '-') // everything else disallowed → dash
    .replace(/-+/g, '-') // collapse consecutive dashes
    .replace(/^-|-$/g, ''); // strip leading/trailing dashes
}

export function generateId(name: string, source: SkillSource): string {
  return `${source}-${normalizeSkillSlug(name)}`;
}

export function sanitizeSkillName(name: string): string {
  return normalizeSkillSlug(name);
}
