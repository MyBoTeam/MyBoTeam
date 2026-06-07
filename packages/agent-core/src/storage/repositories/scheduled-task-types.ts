import type { ScheduledTask } from '../../common/types/daemon.js';

export interface ScheduledTaskRow {
  id: string;
  cron: string;
  prompt: string;
  workspace_id: string | null;
  is_enabled: number;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export function rowToScheduledTask(row: ScheduledTaskRow): ScheduledTask {
  return {
    id: row.id,
    cron: row.cron,
    prompt: row.prompt,
    workspaceId: row.workspace_id || undefined,
    enabled: row.is_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRunAt: row.last_run_at || undefined,
    nextRunAt: row.next_run_at || undefined,
  };
}

export function parseCronField(field: string, min: number, max: number): number[] | null {
  const values: number[] = [];

  for (const part of field.split(',')) {
    const trimmed = part.trim();

    if (trimmed === '*') {
      for (let i = min; i <= max; i++) {
        values.push(i);
      }
      continue;
    }

    const stepMatch = trimmed.match(/^\*\/(\d+)$/);
    if (stepMatch) {
      const step = parseInt(stepMatch[1], 10);
      if (step <= 0) {
        return null;
      }
      for (let i = min; i <= max; i += step) {
        values.push(i);
      }
      continue;
    }

    const rangeMatch = trimmed.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const step = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : 1;
      if (start < min || end > max || start > end || step <= 0) {
        return null;
      }
      for (let i = start; i <= end; i += step) {
        values.push(i);
      }
      continue;
    }

    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num < min || num > max) {
      return null;
    }
    values.push(num);
  }

  return values.length > 0 ? [...new Set(values)].sort((a, b) => a - b) : null;
}

export function computeNextRunAt(cron: string, from: Date): string | null {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return null;
  }

  const minutes = parseCronField(fields[0], 0, 59);
  const hours = parseCronField(fields[1], 0, 23);
  const doms = parseCronField(fields[2], 1, 31);
  const months = parseCronField(fields[3], 1, 12);
  const dows = parseCronField(fields[4], 0, 6);

  if (!minutes || !hours || !doms || !months || !dows) {
    return null;
  }

  const start = new Date(from.getTime());
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const maxDays = 1461;

  for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
    const day = new Date(start.getTime());
    if (dayOffset > 0) {
      day.setDate(day.getDate() + dayOffset);
      day.setHours(0, 0, 0, 0);
    }

    if (
      dayOffset > 0 &&
      (!doms.includes(day.getDate()) ||
        !months.includes(day.getMonth() + 1) ||
        !dows.includes(day.getDay()))
    ) {
      continue;
    }

    for (const hour of hours) {
      for (const minute of minutes) {
        const candidate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hour,
          minute,
          0,
          0,
        );
        if (candidate.getTime() <= from.getTime()) {
          continue;
        }
        if (
          doms.includes(candidate.getDate()) &&
          months.includes(candidate.getMonth() + 1) &&
          dows.includes(candidate.getDay())
        ) {
          return candidate.toISOString();
        }
      }
    }
  }

  return null;
}
