import type { Skill } from '../../common/types/skills.js';
import { getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import { rowToSkill, type SkillRow } from './skill-common.js';

export function getAllSkills(): Skill[] {
  const db = getDatabase();
  const rows = rowsFromResult<SkillRow>(db.exec('SELECT * FROM skills ORDER BY name'));
  return rows.map(rowToSkill);
}

export function getEnabledSkills(): Skill[] {
  const db = getDatabase();
  const rows = rowsFromResult<SkillRow>(
    db.exec('SELECT * FROM skills WHERE is_enabled = 1 ORDER BY name'),
  );
  return rows.map(rowToSkill);
}

export function getSkillById(id: string): Skill | null {
  const db = getDatabase();
  const row = rowFromResult<SkillRow>(db.exec('SELECT * FROM skills WHERE id = ?', [id]));
  return row ? rowToSkill(row) : null;
}
