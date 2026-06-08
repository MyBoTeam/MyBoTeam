import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
  createSkillsManager,
  type Skill,
  type SkillsChangedPayload,
  type SkillsManagerAPI,
} from '@myboteam/agent-core';

const SKILLS_CHANGED = 'skills.changed' as const;

export interface SkillsServiceOptions {
  dataDir: string;

  bundledSkillsPath: string;
}

export class SkillsService extends EventEmitter {
  private readonly inner: SkillsManagerAPI;
  private readonly userSkillsPath: string;
  private initialized = false;

  constructor(opts: SkillsServiceOptions) {
    super();
    this.userSkillsPath = path.join(opts.dataDir, 'skills');
    this.inner = createSkillsManager({
      bundledSkillsPath: opts.bundledSkillsPath,
      userSkillsPath: this.userSkillsPath,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.inner.initialize();
    this.initialized = true;
  }

  list(): Skill[] {
    return this.inner.getAllSkills();
  }

  listEnabled(): Skill[] {
    return this.inner.getEnabledSkills();
  }

  getContent(skillId: string): string | null {
    return this.inner.getSkillContent(skillId);
  }

  getUserSkillsPath(): string {
    return this.userSkillsPath;
  }

  setEnabled(skillId: string, enabled: boolean): void {
    this.inner.setSkillEnabled(skillId, enabled);
    this.emitChange('updated');
  }

  async addFromPath(sourcePath: string): Promise<Skill | null> {
    const skill = await this.inner.addSkill(sourcePath);
    if (skill) {
      this.emitChange('added');
    }
    return skill;
  }

  delete(skillId: string): void {
    const deleted = this.inner.deleteSkill(skillId);
    if (!deleted) {
      throw new Error('Skill not found or cannot be deleted');
    }
    this.emitChange('removed');
  }

  async resync(): Promise<Skill[]> {
    const skills = await this.inner.resync();
    this.emitChange('resynced');
    return skills;
  }

  private emitChange(kind: SkillsChangedPayload['kind']): void {
    this.emit(SKILLS_CHANGED, { kind } satisfies SkillsChangedPayload);
  }
}

export type { SkillsChangedPayload };
