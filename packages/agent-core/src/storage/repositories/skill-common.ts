import type { Skill, SkillSource } from '../../common/types/skills.js';

export interface SkillRow {
  id: string;
  name: string;
  command: string;
  description: string;
  source: string;
  is_enabled: number;
  is_verified: number;
  is_hidden: number;
  file_path: string;
  github_url: string | null;
  updated_at: string;
}

export function rowToSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    command: row.command,
    description: row.description,
    source: row.source as SkillSource,
    isEnabled: row.is_enabled === 1,
    isVerified: row.is_verified === 1,
    isHidden: row.is_hidden === 1,
    filePath: row.file_path,
    githubUrl: row.github_url || undefined,
    updatedAt: row.updated_at,
  };
}
