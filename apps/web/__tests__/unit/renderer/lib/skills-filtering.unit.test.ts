import type { Skill } from '@myboteam/agent-core';
import { describe, expect, it } from 'vitest';
import {
  getFilterCounts,
  getFilteredSkills,
  getVisibleSkills,
} from '@/pages/settings/skills/components/skillsFiltering';

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: overrides.name ?? 'test',
    name: 'Test',
    command: '/test',
    description: 'Test description',
    isEnabled: false,
    isHidden: false,
    source: 'community',
    ...overrides,
  };
}

describe('getVisibleSkills', () => {
  it('filters out hidden skills', () => {
    const skills = [
      makeSkill({ name: 'A', isHidden: false }),
      makeSkill({ name: 'B', isHidden: true }),
      makeSkill({ name: 'C', isHidden: false }),
    ];
    expect(getVisibleSkills(skills)).toHaveLength(2);
    expect(getVisibleSkills(skills).map((s) => s.name)).toEqual(['A', 'C']);
  });
});

describe('getFilterCounts', () => {
  const skills = [
    makeSkill({ name: 'A', isEnabled: true, source: 'official' }),
    makeSkill({ name: 'B', isEnabled: false, source: 'community' }),
    makeSkill({ name: 'C', isEnabled: true, source: 'community' }),
  ];

  it('counts all visible skills', () => {
    const counts = getFilterCounts(skills);
    expect(counts.all).toBe(3);
    expect(counts.active).toBe(2);
    expect(counts.inactive).toBe(1);
    expect(counts.official).toBe(1);
  });
});

describe('getFilteredSkills', () => {
  const skills = [
    makeSkill({ name: 'Write', command: '/write', description: 'Write files', isEnabled: true }),
    makeSkill({ name: 'Read', command: '/read', description: 'Read files', isEnabled: false }),
    makeSkill({
      name: 'Bash',
      command: '/bash',
      description: 'Run commands',
      isEnabled: true,
      source: 'official',
    }),
  ];

  it('returns all skills for "all" filter', () => {
    expect(getFilteredSkills(skills, 'all', '')).toHaveLength(3);
  });

  it('filters by active', () => {
    const result = getFilteredSkills(skills, 'active', '');
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.isEnabled)).toBe(true);
  });

  it('filters by inactive', () => {
    const result = getFilteredSkills(skills, 'inactive', '');
    expect(result).toHaveLength(1);
    expect(result[0]?.isEnabled).toBe(false);
  });

  it('filters by official source', () => {
    const result = getFilteredSkills(skills, 'official', '');
    expect(result).toHaveLength(1);
    expect(result[0]?.source).toBe('official');
  });

  it('filters by search query matching name', () => {
    expect(getFilteredSkills(skills, 'all', 'write')).toHaveLength(1);
  });

  it('filters by search query matching description', () => {
    expect(getFilteredSkills(skills, 'all', 'files')).toHaveLength(2);
  });

  it('filters by search query matching command', () => {
    expect(getFilteredSkills(skills, 'all', '/bash')).toHaveLength(1);
  });

  it('search is case-insensitive', () => {
    expect(getFilteredSkills(skills, 'all', 'WRITE')).toHaveLength(1);
  });

  it('combines filter and search', () => {
    const result = getFilteredSkills(skills, 'active', 'read');
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no match', () => {
    expect(getFilteredSkills(skills, 'all', 'nonexistent')).toHaveLength(0);
  });
});
