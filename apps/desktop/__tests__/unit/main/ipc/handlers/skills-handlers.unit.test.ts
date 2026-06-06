import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSkillsManager = vi.hoisted(() => ({
  getAll: vi.fn(),
  getEnabled: vi.fn(),
  setEnabled: vi.fn(),
  getContent: vi.fn(),
  getUserSkillsPath: vi.fn(),
  addFromFolder: vi.fn(),
  addFromGitHub: vi.fn(),
  delete: vi.fn(),
  resync: vi.fn(),
}));

vi.mock('@main/skills', () => ({
  skillsManager: mockSkillsManager,
}));

const mockDialog = vi.hoisted(() => ({
  showOpenDialog: vi.fn(),
}));
const mockShell = vi.hoisted(() => ({
  openPath: vi.fn(),
  showItemInFolder: vi.fn(),
}));

vi.mock('electron', () => ({
  BrowserWindow: {
    fromWebContents: vi.fn(() => ({})),
    getAllWindows: vi.fn(() => [{ id: 1 }]),
  },
  dialog: mockDialog,
  shell: mockShell,
}));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};
vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerSkillsHandlers } from '@main/ipc/handlers/skills-handlers';

describe('skills-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    registerSkillsHandlers();
  });

  describe('skills:list', () => {
    it('should return all skills', async () => {
      mockSkillsManager.getAll.mockResolvedValue([{ id: 'skill-1' }]);
      const result = await handlers['skills:list']();
      expect(mockSkillsManager.getAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'skill-1' }]);
    });
  });

  describe('skills:list-enabled', () => {
    it('should return enabled skills', async () => {
      mockSkillsManager.getEnabled.mockResolvedValue([{ id: 'skill-1' }]);
      const result = await handlers['skills:list-enabled']();
      expect(mockSkillsManager.getEnabled).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'skill-1' }]);
    });
  });

  describe('skills:set-enabled', () => {
    it('should set skill enabled state', async () => {
      await handlers['skills:set-enabled']({} as unknown, 'skill-1', true);
      expect(mockSkillsManager.setEnabled).toHaveBeenCalledWith('skill-1', true);
    });

    it('should set skill disabled state', async () => {
      await handlers['skills:set-enabled']({} as unknown, 'skill-1', false);
      expect(mockSkillsManager.setEnabled).toHaveBeenCalledWith('skill-1', false);
    });
  });

  describe('skills:get-content', () => {
    it('should return skill content', async () => {
      mockSkillsManager.getContent.mockResolvedValue('# Skill Content');
      const result = await handlers['skills:get-content']({} as unknown, 'skill-1');
      expect(mockSkillsManager.getContent).toHaveBeenCalledWith('skill-1');
      expect(result).toBe('# Skill Content');
    });
  });

  describe('skills:get-user-skills-path', () => {
    it('should return user skills path', async () => {
      mockSkillsManager.getUserSkillsPath.mockResolvedValue('/skills/path');
      const result = await handlers['skills:get-user-skills-path']();
      expect(mockSkillsManager.getUserSkillsPath).toHaveBeenCalled();
      expect(result).toBe('/skills/path');
    });
  });

  describe('skills:pick-folder', () => {
    it('should return selected folder path', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/skills/folder'],
      });
      const result = await handlers['skills:pick-folder']({ sender: {} } as unknown);
      expect(result).toBe('/skills/folder');
    });

    it('should return null when cancelled', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
      const result = await handlers['skills:pick-folder']({ sender: {} } as unknown);
      expect(result).toBeNull();
    });
  });

  describe('skills:add-from-folder', () => {
    it('should add skill from folder', async () => {
      mockSkillsManager.addFromFolder.mockResolvedValue({ id: 'new-skill' });
      const result = await handlers['skills:add-from-folder']({} as unknown, '/path/to/skill');
      expect(mockSkillsManager.addFromFolder).toHaveBeenCalledWith('/path/to/skill');
      expect(result).toEqual({ id: 'new-skill' });
    });
  });

  describe('skills:add-from-github', () => {
    it('should add skill from GitHub URL', async () => {
      mockSkillsManager.addFromGitHub.mockResolvedValue({ id: 'github-skill' });
      const result = await handlers['skills:add-from-github'](
        {} as unknown,
        'https://github.com/user/repo',
      );
      expect(mockSkillsManager.addFromGitHub).toHaveBeenCalledWith('https://github.com/user/repo');
      expect(result).toEqual({ id: 'github-skill' });
    });
  });

  describe('skills:delete', () => {
    it('should delete skill', async () => {
      await handlers['skills:delete']({} as unknown, 'skill-1');
      expect(mockSkillsManager.delete).toHaveBeenCalledWith('skill-1');
    });
  });

  describe('skills:resync', () => {
    it('should resync and return all skills', async () => {
      mockSkillsManager.resync.mockResolvedValue(undefined);
      mockSkillsManager.getAll.mockResolvedValue([{ id: 'skill-1' }]);
      const result = await handlers['skills:resync']();
      expect(mockSkillsManager.resync).toHaveBeenCalled();
      expect(mockSkillsManager.getAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'skill-1' }]);
    });
  });

  describe('skills:open-in-editor', () => {
    it('should open skill file in editor', async () => {
      mockShell.openPath.mockResolvedValue('');
      await handlers['skills:open-in-editor']({} as unknown, '/path/to/skill.md');
      expect(mockShell.openPath).toHaveBeenCalledWith('/path/to/skill.md');
    });

    it('should throw on open error', async () => {
      mockShell.openPath.mockResolvedValue('Error opening file');
      await expect(
        handlers['skills:open-in-editor']({} as unknown, '/path/to/skill.md'),
      ).rejects.toThrow('Failed to open path in editor');
    });
  });

  describe('skills:show-in-folder', () => {
    it('should show skill file in folder', async () => {
      await handlers['skills:show-in-folder']({} as unknown, '/path/to/skill.md');
      expect(mockShell.showItemInFolder).toHaveBeenCalledWith('/path/to/skill.md');
    });
  });
});
