import type { Skill } from '@myboteam/agent-core/desktop-main';
import { getDaemonClient } from '../daemon-bootstrap';

export class SkillsManager {
  private cachedUserSkillsPath: string | null = null;

  async getUserSkillsPath(): Promise<string> {
    if (!this.cachedUserSkillsPath) {
      this.cachedUserSkillsPath = await getDaemonClient().call('skills.getUserSkillsPath');
    }
    return this.cachedUserSkillsPath;
  }

  async initialize(): Promise<void> {}

  async resync(): Promise<Skill[]> {
    return getDaemonClient().call('skills.resync');
  }

  async getAll(): Promise<Skill[]> {
    return getDaemonClient().call('skills.list');
  }

  async getEnabled(): Promise<Skill[]> {
    return getDaemonClient().call('skills.listEnabled');
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await getDaemonClient().call('skills.setEnabled', { skillId: id, enabled });
  }

  async getContent(id: string): Promise<string | null> {
    return getDaemonClient().call('skills.getContent', { skillId: id });
  }

  async addFromFile(sourcePath: string): Promise<Skill | null> {
    return getDaemonClient().call('skills.addFromPath', { sourcePath });
  }

  async addFromFolder(folderPath: string): Promise<Skill | null> {
    return getDaemonClient().call('skills.addFromPath', { sourcePath: folderPath });
  }

  async addFromGitHub(rawUrl: string): Promise<Skill | null> {
    return getDaemonClient().call('skills.addFromPath', { sourcePath: rawUrl });
  }

  async delete(id: string): Promise<void> {
    await getDaemonClient().call('skills.delete', { skillId: id });
  }
}

export const skillsManager = new SkillsManager();
