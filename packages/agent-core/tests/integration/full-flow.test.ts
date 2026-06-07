import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Core Package Integration', () => {
  let tempDir: string;
  let dbPath: string;
  let secureStoragePath: string;
  let bundledSkillsPath: string;
  let userSkillsPath: string;

  let databaseModule: typeof import('../../src/storage/database.js') | null = null;
  let secureStorageModule: typeof import('../../src/storage/secure-storage.js') | null = null;
  let migrationsModule: typeof import('../../src/storage/migrations/index.js') | null = null;
  let skillsModule: typeof import('../../src/skills/skills-manager.js') | null = null;
  let pathsModule: typeof import('../../src/utils/paths.js') | null = null;

  beforeAll(async () => {
    databaseModule = await import('../../src/storage/database.js');
    secureStorageModule = await import('../../src/storage/secure-storage.js');
    migrationsModule = await import('../../src/storage/migrations/index.js');
    skillsModule = await import('../../src/internal/classes/SkillsManager.js');
    pathsModule = await import('../../src/utils/paths.js');
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-integration-'));
    dbPath = path.join(tempDir, 'test.db');
    secureStoragePath = tempDir;
    bundledSkillsPath = path.join(tempDir, 'bundled-skills');
    userSkillsPath = path.join(tempDir, 'user-skills');

    fs.mkdirSync(bundledSkillsPath, { recursive: true });
    fs.mkdirSync(userSkillsPath, { recursive: true });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (databaseModule) {
      databaseModule.resetDatabaseInstance();
    }

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    vi.restoreAllMocks();
  });

  describe('Database initialization with migrations', () => {
    it('should initialize database and run all migrations', async () => {
      if (!databaseModule || !migrationsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      expect(db).toBeDefined();
      expect(databaseModule.isDatabaseInitialized()).toBe(true);
      expect(databaseModule.getDatabasePath()).toBe(dbPath);

      const version = migrationsModule.getStoredVersion(db);
      expect(version).toBeGreaterThan(0);
      expect(version).toBe(migrationsModule.CURRENT_VERSION);

      const [tablesResult] = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tablesResult.values.map((v) => v[0] as string);

      expect(tableNames).toContain('schema_meta');
      expect(tableNames).toContain('app_settings');
      expect(tableNames).toContain('providers');
      expect(tableNames).toContain('provider_meta');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('skills');
    });

    it('should handle database close and reopen', async () => {
      if (!databaseModule) return;

      const db1 = await databaseModule.initializeDatabase({ databasePath: dbPath });
      expect(databaseModule.isDatabaseInitialized()).toBe(true);

      databaseModule.closeDatabase();
      expect(databaseModule.isDatabaseInitialized()).toBe(false);

      const db2 = await databaseModule.initializeDatabase({ databasePath: dbPath });
      expect(databaseModule.isDatabaseInitialized()).toBe(true);

      expect(db1 === db2).toBe(false);
    });
  });

  describe('Secure storage for API keys', () => {
    it('should store and retrieve API keys securely', () => {
      if (!secureStorageModule) return;

      const storage = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });

      storage.storeApiKey('anthropic', 'sk-ant-test-key-12345');
      storage.storeApiKey('openai', 'sk-openai-test-key-67890');
      storage.storeApiKey('google', 'google-api-key-abcdef');

      expect(storage.getApiKey('anthropic')).toBe('sk-ant-test-key-12345');
      expect(storage.getApiKey('openai')).toBe('sk-openai-test-key-67890');
      expect(storage.getApiKey('google')).toBe('google-api-key-abcdef');
    });

    it('should delete API keys', () => {
      if (!secureStorageModule) return;

      const storage = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });

      storage.storeApiKey('xai', 'xai-api-key-xyz');
      expect(storage.getApiKey('xai')).toBe('xai-api-key-xyz');

      const deleted = storage.deleteApiKey('xai');
      expect(deleted).toBe(true);
      expect(storage.getApiKey('xai')).toBeNull();
    });

    it('should persist data across storage instances', () => {
      if (!secureStorageModule) return;

      const storage1 = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });
      storage1.storeApiKey('anthropic', 'persistent-key');

      const storage2 = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });

      expect(storage2.getApiKey('anthropic')).toBe('persistent-key');
    });

    it('should report if any API key exists', async () => {
      if (!secureStorageModule) return;

      const storage = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });

      expect(await storage.hasAnyApiKey()).toBe(false);

      storage.storeApiKey('openai', 'test-key');
      expect(await storage.hasAnyApiKey()).toBe(true);
    });

    it('should get all API keys at once', async () => {
      if (!secureStorageModule) return;

      const storage = secureStorageModule.createSecureStorage({
        storagePath: secureStoragePath,
        appId: 'integration-test',
      });

      storage.storeApiKey('anthropic', 'key1');
      storage.storeApiKey('openai', 'key2');

      const allKeys = await storage.getAllApiKeys();
      expect(allKeys.anthropic).toBe('key1');
      expect(allKeys.openai).toBe('key2');
      expect(allKeys.google).toBeNull();
      expect(allKeys.xai).toBeNull();
    });
  });

  describe('Platform config creation', () => {
    it('should create platform config with defaults', () => {
      if (!pathsModule) return;

      const config = pathsModule.createDefaultPlatformConfig('TestApp');

      expect(config.userDataPath).toBeDefined();
      expect(config.userDataPath.length).toBeGreaterThan(0);
      expect(config.tempPath).toBe(os.tmpdir());
      expect(config.isPackaged).toBe(false);
      expect(config.platform).toBe(process.platform);
      expect(config.arch).toBe(process.arch);
    });

    it('should accept overrides for platform config', () => {
      if (!pathsModule) return;

      const customPath = '/custom/user/data';
      const config = pathsModule.createDefaultPlatformConfig('TestApp', {
        userDataPath: customPath,
        isPackaged: true,
        resourcesPath: '/app/resources',
      });

      expect(config.userDataPath).toBe(customPath);
      expect(config.isPackaged).toBe(true);
      expect(config.resourcesPath).toBe('/app/resources');

      expect(config.tempPath).toBe(os.tmpdir());
    });

    it('should resolve paths relative to user data', () => {
      if (!pathsModule) return;

      const config = pathsModule.createDefaultPlatformConfig('TestApp', {
        userDataPath: '/app/data',
      });

      const resolved = pathsModule.resolveUserDataPath(config, 'databases', 'main.db');
      expect(resolved).toBe(path.join('/app/data', 'databases', 'main.db'));
    });

    it('should resolve resources path when set', () => {
      if (!pathsModule) return;

      const config = pathsModule.createDefaultPlatformConfig('TestApp', {
        resourcesPath: '/app/resources',
      });

      const resolved = pathsModule.resolveResourcesPath(config, 'assets', 'logo.png');
      expect(resolved).toBe(path.join('/app/resources', 'assets', 'logo.png'));
    });

    it('should return null for resources path when not set', () => {
      if (!pathsModule) return;

      const config = pathsModule.createDefaultPlatformConfig('TestApp');

      const resolved = pathsModule.resolveResourcesPath(config, 'assets', 'logo.png');
      expect(resolved).toBeNull();
    });
  });

  describe('Skills manager with database sync', () => {
    function createSkillFile(
      basePath: string,
      name: string,
      frontmatter: Record<string, unknown> = {},
    ) {
      const skillDir = path.join(basePath, name);
      fs.mkdirSync(skillDir, { recursive: true });

      const fm = {
        name: frontmatter.name || name,
        description: frontmatter.description || `Description for ${name}`,
        ...frontmatter,
      };

      const content = `---
name: ${fm.name}
description: ${fm.description}
${fm.command ? `command: ${fm.command}` : ''}
${fm.verified ? 'verified: true' : ''}
---

# ${fm.name}

This is the skill content for ${fm.name}.
`;

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
      return path.join(skillDir, 'SKILL.md');
    }

    it('should discover skills and sync to database', async () => {
      if (!databaseModule || !skillsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      createSkillFile(bundledSkillsPath, 'test-skill-1', {
        name: 'Test Skill One',
        description: 'First test skill',
        command: '/test1',
      });
      createSkillFile(bundledSkillsPath, 'test-skill-2', {
        name: 'Test Skill Two',
        description: 'Second test skill',
      });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath,
        database: db,
      });

      await manager.initialize();

      const skills = manager.getAllSkills();
      expect(skills.length).toBe(2);

      const [dbSkillsResult] = db.exec('SELECT * FROM skills');
      const dbSkills = dbSkillsResult.values.map((v) => ({ name: v[1] as string }));
      expect(dbSkills.length).toBe(2);

      const skillNames = dbSkills.map((s) => s.name);
      expect(skillNames).toContain('Test Skill One');
      expect(skillNames).toContain('Test Skill Two');
    });

    it('should preserve enabled state through resync', async () => {
      if (!databaseModule || !skillsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      createSkillFile(bundledSkillsPath, 'toggle-skill', {
        name: 'Toggle Skill',
        description: 'A skill to toggle',
      });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath,
        database: db,
      });

      await manager.initialize();

      const skill = manager.getAllSkills()[0];
      manager.setSkillEnabled(skill.id, false);
      expect(manager.getSkillById(skill.id)?.isEnabled).toBe(false);

      await manager.resync();

      expect(manager.getSkillById(skill.id)?.isEnabled).toBe(false);
    });

    it('should differentiate between official and custom skills', async () => {
      if (!databaseModule || !skillsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      createSkillFile(bundledSkillsPath, 'official-skill', {
        name: 'Official Skill',
        description: 'An official bundled skill',
      });
      createSkillFile(userSkillsPath, 'custom-skill', {
        name: 'Custom Skill',
        description: 'A user-added custom skill',
      });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath,
        database: db,
      });

      await manager.initialize();

      const skills = manager.getAllSkills();
      const official = skills.find((s) => s.name === 'Official Skill');
      const custom = skills.find((s) => s.name === 'Custom Skill');

      expect(official?.source).toBe('official');
      expect(custom?.source).toBe('custom');
    });

    it('should allow adding custom skills from file', async () => {
      if (!databaseModule || !skillsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath,
        database: db,
      });

      await manager.initialize();

      const importDir = path.join(tempDir, 'import');
      fs.mkdirSync(importDir, { recursive: true });
      const skillContent = `---
name: Imported Skill
description: An imported custom skill
---

Imported content here.
`;
      const importPath = path.join(importDir, 'SKILL.md');
      fs.writeFileSync(importPath, skillContent);

      const importedSkill = await manager.addSkill(importPath);

      expect(importedSkill).not.toBeNull();
      expect(importedSkill?.name).toBe('Imported Skill');
      expect(importedSkill?.source).toBe('custom');

      const skills = manager.getAllSkills();
      expect(skills.some((s) => s.name === 'Imported Skill')).toBe(true);
    });

    it('should allow deleting custom skills but not official skills', async () => {
      if (!databaseModule || !skillsModule) return;

      const db = await databaseModule.initializeDatabase({ databasePath: dbPath });

      createSkillFile(bundledSkillsPath, 'official', {
        name: 'Official',
        description: 'Official skill',
      });
      createSkillFile(userSkillsPath, 'custom', {
        name: 'Custom',
        description: 'Custom skill',
      });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath,
        database: db,
      });

      await manager.initialize();

      const skills = manager.getAllSkills();
      const official = skills.find((s) => s.name === 'Official')!;
      const custom = skills.find((s) => s.name === 'Custom')!;

      expect(manager.deleteSkill(official.id)).toBe(false);
      expect(manager.getSkillById(official.id)).not.toBeNull();

      expect(manager.deleteSkill(custom.id)).toBe(true);
      expect(manager.getSkillById(custom.id)).toBeNull();
    });
  });

  describe('Full workflow integration', () => {
    it('should support complete app initialization workflow', async () => {
      if (!databaseModule || !secureStorageModule || !skillsModule || !pathsModule) return;

      const platformConfig = pathsModule.createDefaultPlatformConfig('IntegrationTest', {
        userDataPath: tempDir,
      });

      const dbFullPath = pathsModule.resolveUserDataPath(platformConfig, 'test.db');
      const db = await databaseModule.initializeDatabase({ databasePath: dbFullPath });

      const storage = secureStorageModule.createSecureStorage({
        storagePath: platformConfig.userDataPath,
        appId: 'integration-test',
      });

      storage.storeApiKey('anthropic', 'sk-ant-integration-test');

      const skillsPath = pathsModule.resolveUserDataPath(platformConfig, 'skills');
      fs.mkdirSync(skillsPath, { recursive: true });

      const manager = new skillsModule.SkillsManager({
        bundledSkillsPath,
        userSkillsPath: skillsPath,
        database: db,
      });

      await manager.initialize();

      expect(databaseModule.isDatabaseInitialized()).toBe(true);
      expect(storage.getApiKey('anthropic')).toBe('sk-ant-integration-test');
      expect(manager.getAllSkills()).toBeDefined();

      databaseModule.closeDatabase();
    });
  });
});
