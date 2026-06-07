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

export function normalizeSkillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateId(name: string, source: SkillSource): string {
  return `${source}-${normalizeSkillSlug(name)}`;
}

export function sanitizeSkillName(name: string): string {
  return normalizeSkillSlug(name);
}
