import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonCall = vi.fn();

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => ({ call: mockDaemonCall })),
}));

import { SkillsManager } from '@main/skills/SkillsManager';

describe('SkillsManager', () => {
  let manager: SkillsManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SkillsManager();
  });

  describe('getUserSkillsPath', () => {
    it('should fetch and cache the path from the daemon', async () => {
      mockDaemonCall.mockResolvedValueOnce('/mock/skills/path');

      const first = await manager.getUserSkillsPath();
      expect(first).toBe('/mock/skills/path');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.getUserSkillsPath');

      const second = await manager.getUserSkillsPath();
      expect(second).toBe('/mock/skills/path');
      expect(mockDaemonCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialize', () => {
    it('should be a no-op', async () => {
      await expect(manager.initialize()).resolves.toBeUndefined();
      expect(mockDaemonCall).not.toHaveBeenCalled();
    });
  });

  describe('resync', () => {
    it('should call skills.resync RPC and return skills', async () => {
      const skills = [{ id: 'test', name: 'Test Skill' }];
      mockDaemonCall.mockResolvedValueOnce(skills);

      const result = await manager.resync();
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.resync');
      expect(result).toEqual(skills);
    });
  });

  describe('getAll', () => {
    it('should call skills.list RPC', async () => {
      const skills = [{ id: 'a' }, { id: 'b' }];
      mockDaemonCall.mockResolvedValueOnce(skills);

      const result = await manager.getAll();
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.list');
      expect(result).toEqual(skills);
    });
  });

  describe('getEnabled', () => {
    it('should call skills.listEnabled RPC', async () => {
      const skills = [{ id: 'enabled-1' }];
      mockDaemonCall.mockResolvedValueOnce(skills);

      const result = await manager.getEnabled();
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.listEnabled');
      expect(result).toEqual(skills);
    });
  });

  describe('setEnabled', () => {
    it('should call skills.setEnabled RPC', async () => {
      await manager.setEnabled('skill-1', true);
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.setEnabled', {
        skillId: 'skill-1',
        enabled: true,
      });
    });

    it('should call skills.setEnabled RPC to disable', async () => {
      await manager.setEnabled('skill-1', false);
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.setEnabled', {
        skillId: 'skill-1',
        enabled: false,
      });
    });
  });

  describe('getContent', () => {
    it('should call skills.getContent RPC and return content', async () => {
      mockDaemonCall.mockResolvedValueOnce('skill content here');
      const result = await manager.getContent('skill-1');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.getContent', { skillId: 'skill-1' });
      expect(result).toBe('skill content here');
    });

    it('should return null when skill not found', async () => {
      mockDaemonCall.mockResolvedValueOnce(null);
      const result = await manager.getContent('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('addFromFile', () => {
    it('should call skills.addFromPath RPC with sourcePath', async () => {
      const skill = { id: 'new-skill' };
      mockDaemonCall.mockResolvedValueOnce(skill);

      const result = await manager.addFromFile('/path/to/skill.yaml');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.addFromPath', {
        sourcePath: '/path/to/skill.yaml',
      });
      expect(result).toEqual(skill);
    });
  });

  describe('addFromFolder', () => {
    it('should call skills.addFromPath RPC with folder path', async () => {
      const skill = { id: 'folder-skill' };
      mockDaemonCall.mockResolvedValueOnce(skill);

      const result = await manager.addFromFolder('/path/to/folder');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.addFromPath', {
        sourcePath: '/path/to/folder',
      });
      expect(result).toEqual(skill);
    });
  });

  describe('addFromGitHub', () => {
    it('should call skills.addFromPath RPC with raw URL', async () => {
      const skill = { id: 'gh-skill' };
      mockDaemonCall.mockResolvedValueOnce(skill);

      const result = await manager.addFromGitHub('https://raw.githubusercontent.com/...');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.addFromPath', {
        sourcePath: 'https://raw.githubusercontent.com/...',
      });
      expect(result).toEqual(skill);
    });
  });

  describe('delete', () => {
    it('should call skills.delete RPC', async () => {
      await manager.delete('skill-to-remove');
      expect(mockDaemonCall).toHaveBeenCalledWith('skills.delete', {
        skillId: 'skill-to-remove',
      });
    });
  });
});
