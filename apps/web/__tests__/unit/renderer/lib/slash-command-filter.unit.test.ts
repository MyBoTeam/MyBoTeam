import type { Skill } from '@myboteam/agent-core';
import { describe, expect, it } from 'vitest';
import { filterSkills, findSlashContext, isSlashTrigger } from '@/hooks/useSlashCommandFilter';

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'test',
    name: 'Test Skill',
    command: '/test',
    description: 'A test skill',
    isHidden: false,
    ...overrides,
  };
}

describe('isSlashTrigger', () => {
  it('returns false when character is not a slash', () => {
    expect(isSlashTrigger('abc', 0)).toBe(false);
  });

  it('returns true when slash is at position 0', () => {
    expect(isSlashTrigger('/cmd', 0)).toBe(true);
  });

  it('returns true when slash is preceded by whitespace', () => {
    expect(isSlashTrigger('hello /cmd', 6)).toBe(true);
  });

  it('returns false when slash is not preceded by whitespace', () => {
    expect(isSlashTrigger('hello/cmd', 5)).toBe(false);
  });
});

describe('filterSkills', () => {
  const skills = [
    makeSkill({ command: '/write', name: 'Write', description: 'Write files' }),
    makeSkill({ command: '/read', name: 'Read', description: 'Read files' }),
    makeSkill({ command: '/bash', name: 'Bash', description: 'Run commands' }),
  ];

  it('returns all skills when query is empty', () => {
    expect(filterSkills(skills, '')).toHaveLength(3);
  });

  it('filters by command', () => {
    const result = filterSkills(skills, 'write');
    expect(result).toHaveLength(1);
    expect(result[0]?.command).toBe('/write');
  });

  it('filters by name', () => {
    const result = filterSkills(skills, 'Bash');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Bash');
  });

  it('filters by description', () => {
    const result = filterSkills(skills, 'Run');
    expect(result).toHaveLength(1);
    expect(result[0]?.command).toBe('/bash');
  });

  it('is case-insensitive', () => {
    expect(filterSkills(skills, 'WRITE')).toHaveLength(1);
    expect(filterSkills(skills, 'write')).toHaveLength(1);
  });

  it('returns empty array when no match', () => {
    expect(filterSkills(skills, 'nonexistent')).toHaveLength(0);
  });
});

describe('findSlashContext', () => {
  it('returns trigger at start of string', () => {
    expect(findSlashContext('/cmd', 4)).toEqual({ triggerStart: 0, query: 'cmd' });
  });

  it('returns trigger after whitespace', () => {
    expect(findSlashContext('prefix /cmd', 11)).toEqual({ triggerStart: 7, query: 'cmd' });
  });

  it('returns null when no slash found', () => {
    expect(findSlashContext('no slash here', 14)).toBeNull();
  });

  it('returns null when slash is mid-word', () => {
    expect(findSlashContext('abc/def', 7)).toBeNull();
  });

  it('returns null when cursor is before the slash', () => {
    expect(findSlashContext('/cmd', 0)).toBeNull();
  });

  it('handles empty query after slash', () => {
    expect(findSlashContext('/ cmd', 1)).toEqual({ triggerStart: 0, query: '' });
  });

  it('returns null when search hits whitespace before slash', () => {
    expect(findSlashContext('abc /cmd', 3)).toBeNull();
  });
});
