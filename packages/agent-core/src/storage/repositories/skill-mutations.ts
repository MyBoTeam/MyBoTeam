import type { Skill } from '../../common/types/skills.js';
import { flushDatabase, getDatabase } from '../database.js';

export function upsertSkill(skill: Skill): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO skills (id, name, command, description, source, is_enabled, is_verified, is_hidden, file_path, github_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      command = excluded.command,
      description = excluded.description,
      source = excluded.source,
      is_enabled = excluded.is_enabled,
      is_verified = excluded.is_verified,
      is_hidden = excluded.is_hidden,
      file_path = excluded.file_path,
      github_url = excluded.github_url,
      updated_at = excluded.updated_at`,
    [
      skill.id,
      skill.name,
      skill.command,
      skill.description,
      skill.source,
      skill.isEnabled ? 1 : 0,
      skill.isVerified ? 1 : 0,
      skill.isHidden ? 1 : 0,
      skill.filePath,
      skill.githubUrl || null,
      skill.updatedAt,
    ],
  );
  flushDatabase();
}

export function setSkillEnabled(id: string, enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE skills SET is_enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
  flushDatabase();
}

export function deleteSkill(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM skills WHERE id = ?', [id]);
  flushDatabase();
}

export function clearAllSkills(): void {
  const db = getDatabase();
  db.run('DELETE FROM skills');
  flushDatabase();
}
