import type { AgentConfig } from '@myboteam/types';

/**
 * Default agent configurations for myboteam.
 * Model and provider defaults aligned with ADR-006 (LLM Provider Model).
 */
export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    name: 'orchestrator',
    description:
      'Central coordinator responsible for task distribution and multi-agent orchestration.',
    role: 'coordinator',
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    secrets: [],
    skills: [],
    mcps: [],
  },
  {
    name: 'secretary',
    description: 'Manages scheduling, calendar events, and meeting coordination across the team.',
    role: 'scheduling',
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    secrets: [],
    skills: [],
    mcps: [],
  },
  {
    name: 'accountant',
    description: 'Tracks resource usage, monitors costs, and reports on agent spending.',
    role: 'resource tracking',
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    secrets: [],
    skills: [],
    mcps: [],
  },
];
