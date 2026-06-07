import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Skill, SkillFrontmatter, SkillSource } from '../../common/types/skills.js';
import { upsertSkill as dbUpsertSkill } from '../../storage/repositories/skills.js';
import { createConsoleLogger } from '../../utils/logging.js';
import { prepareSkillDir, validateSkillFrontmatter } from './skill-importer-validate.js';
import { generateId, sanitizeSkillName } from './skill-parser.js';

const log = createConsoleLogger({ prefix: 'SkillsManager' });

export function persistSkill(
  frontmatter: SkillFrontmatter & { name: string },
  destPath: string,
  source: SkillSource,
  githubUrl?: string,
): Skill {
  const safeName = sanitizeSkillName(frontmatter.name);

  const skill: Skill = {
    id: generateId(safeName, source),
    name: frontmatter.name,
    command: frontmatter.command || `/${safeName}`,
    description: frontmatter.description || '',
    source,
    isEnabled: true,
    isVerified: false,
    isHidden: false,
    filePath: destPath,
    ...(githubUrl && { githubUrl }),
    updatedAt: new Date().toISOString(),
  };

  dbUpsertSkill(skill);
  return skill;
}

export function addFromFile(sourcePath: string, userSkillsPath: string): Skill {
  const content = fs.readFileSync(sourcePath, 'utf-8');
  const frontmatter = validateSkillFrontmatter(content);
  const destPath = prepareSkillDir(frontmatter, userSkillsPath);
  fs.copyFileSync(sourcePath, destPath);
  return persistSkill(frontmatter, destPath, 'custom');
}

export function addFromFolder(folderPath: string, userSkillsPath: string): Skill {
  const skillMdPath = path.join(folderPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`Selected folder does not contain a SKILL.md file: ${folderPath}`);
  }

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const frontmatter = validateSkillFrontmatter(content);
  const destSkillMdPath = prepareSkillDir(frontmatter, userSkillsPath);
  const destDir = path.dirname(destSkillMdPath);

  const resolvedSourceDir = path.resolve(folderPath);
  const resolvedDestDir = path.resolve(destDir);

  if (resolvedSourceDir === resolvedDestDir) {
    return persistSkill(frontmatter, destSkillMdPath, 'custom');
  }

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(folderPath, entry.name), path.join(destDir, entry.name));
    }
  }

  return persistSkill(frontmatter, destSkillMdPath, 'custom');
}

export function resolveGithubRawUrl(rawUrl: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  const allowedHosts = ['github.com', 'raw.githubusercontent.com'];
  if (!allowedHosts.includes(parsedUrl.hostname)) {
    throw new Error('URL must be from github.com or raw.githubusercontent.com');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('URL must use HTTPS');
  }

  if (parsedUrl.hostname === 'raw.githubusercontent.com') {
    const rawParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (rawParts.length < 3) {
      throw new Error(
        'URL must include at least owner, repo, and branch (e.g. raw.githubusercontent.com/owner/repo/branch/...)',
      );
    }
    return rawUrl;
  }

  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  const pathWithoutTreeBlob = parsedUrl.pathname
    .replace('/tree/', '/')
    .replace('/blob/', '/')
    .split('/')
    .filter(Boolean);
  if (pathParts.length < 2 || pathWithoutTreeBlob.length < 3) {
    throw new Error(
      'URL must include at least owner, repo, and branch reference (e.g. github.com/owner/repo/tree/branch)',
    );
  }
  let fetchUrl = rawUrl;
  if (rawUrl.includes('/tree/')) {
    fetchUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/tree/', '/');
    if (!fetchUrl.endsWith('SKILL.md')) {
      fetchUrl = fetchUrl.replace(/\/?$/, '/SKILL.md');
    }
  } else if (rawUrl.includes('/blob/')) {
    fetchUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  } else {
    fetchUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com');
    if (!fetchUrl.endsWith('SKILL.md')) {
      fetchUrl = fetchUrl.replace(/\/?$/, '/SKILL.md');
    }
  }
  return fetchUrl;
}

export async function addFromUrl(rawUrl: string, userSkillsPath: string): Promise<Skill> {
  const fetchUrl = resolveGithubRawUrl(rawUrl);

  log.info(`[SkillsManager] Fetching from: ${fetchUrl}`);

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const content = await response.text();
  const frontmatter = validateSkillFrontmatter(content);
  const destPath = prepareSkillDir(frontmatter, userSkillsPath);
  fs.writeFileSync(destPath, content);
  return persistSkill(frontmatter, destPath, 'community', rawUrl);
}
