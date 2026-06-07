import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SkillFrontmatter } from '../../common/types/skills.js';
import { isPathWithinDirectory, parseFrontmatter, sanitizeSkillName } from './skill-parser.js';

export function validateSkillFrontmatter(content: string): SkillFrontmatter & { name: string } {
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter.name) {
    throw new Error('SKILL.md must have a name in frontmatter');
  }

  return frontmatter as SkillFrontmatter & { name: string };
}

export function prepareSkillDir(
  frontmatter: SkillFrontmatter & { name: string },
  userSkillsPath: string,
): string {
  const safeName = sanitizeSkillName(frontmatter.name);
  if (!safeName) {
    throw new Error('Invalid skill name');
  }

  const skillDir = path.join(userSkillsPath, safeName);

  if (!isPathWithinDirectory(skillDir, userSkillsPath)) {
    throw new Error('Invalid skill name: path traversal detected');
  }

  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  return path.join(skillDir, 'SKILL.md');
}
