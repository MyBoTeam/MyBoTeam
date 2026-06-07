import type { Skill } from '@myboteam/agent-core';

export interface SlashCommandState {
  isOpen: boolean;
  query: string;

  triggerStart: number;
  skills: Skill[];
  filteredSkills: Skill[];
  selectedIndex: number;
}

export const INITIAL_SLASH_STATE: SlashCommandState = {
  isOpen: false,
  query: '',
  triggerStart: -1,
  skills: [],
  filteredSkills: [],
  selectedIndex: 0,
};

export interface UseSlashCommandOptions {
  value: string;

  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;

  onChange: (value: string) => void;
}

export interface UseSlashCommandReturn {
  state: SlashCommandState;

  dismiss: () => void;

  selectSkill: (skill: Skill) => void;

  handleKeyDown: (e: React.KeyboardEvent) => boolean;

  handleChange: (newValue: string, selectionStart: number | null) => void;
}

export function filterSkills(skills: Skill[], query: string): Skill[] {
  if (!query) {
    return skills;
  }
  const q = query.toLowerCase();
  return skills.filter(
    (s) =>
      s.command.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
}

export function isSlashTrigger(value: string, pos: number): boolean {
  if (value[pos] !== '/') {
    return false;
  }
  return pos === 0 || /\s/.test(value[pos - 1]);
}

export function findSlashContext(
  value: string,
  cursorPos: number,
): { triggerStart: number; query: string } | null {
  let i = cursorPos - 1;
  while (i >= 0) {
    const ch = value[i];
    if (ch === '/') {
      if (isSlashTrigger(value, i)) {
        return { triggerStart: i, query: value.slice(i + 1, cursorPos) };
      }
      return null;
    }
    if (/\s/.test(ch)) {
      return null;
    }
    i--;
  }
  return null;
}
