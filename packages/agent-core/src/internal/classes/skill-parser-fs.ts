import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Skill, SkillSource } from '../../common/types/skills.js';
import { createConsoleLogger } from '../../utils/logging.js';
import { generateId, normalizeSkillSlug, parseFrontmatter } from './skill-parser-frontmatter.js';

const log = createConsoleLogger({ prefix: 'SkillsManager' });

export function isPathWithinDirectory(filePath: string, directory: string): boolean {
  const resolved = path.resolve(filePath);
  const resolvedDir = path.resolve(directory);
  return resolved.startsWith(resolvedDir + path.sep);
}

export function scanDirectory(dirPath: string, defaultSource: SkillSource): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(dirPath)) {
    return skills;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillMdPath = path.join(dirPath, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    try {
      const content = fs.readFileSync(skillMdPath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      const name = frontmatter.name || entry.name;
      const source = defaultSource;
      const id = generateId(name, source);
      const safeName = normalizeSkillSlug(name);

      skills.push({
        id,
        name,
        command: frontmatter.command || `/${safeName}`,
        description: frontmatter.description || '',
        source,
        isEnabled: true,
        isVerified: frontmatter.verified || false,
        isHidden: frontmatter.hidden || false,
        filePath: skillMdPath,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      log.error(`[SkillsManager] Failed to parse ${skillMdPath}: ${err}`);
    }
  }

  return skills;
}
