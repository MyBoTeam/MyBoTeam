function parseCronField(field: string, min: number, max: number): number[] | null {
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

export function _matchesCron(cron: string, date: Date): boolean {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }

  const minutes = parseCronField(fields[0], 0, 59);
  const hours = parseCronField(fields[1], 0, 23);
  const doms = parseCronField(fields[2], 1, 31);
  const months = parseCronField(fields[3], 1, 12);
  const dows = parseCronField(fields[4], 0, 6);

  if (!minutes || !hours || !doms || !months || !dows) {
    return false;
  }

  return (
    minutes.includes(date.getMinutes()) &&
    hours.includes(date.getHours()) &&
    doms.includes(date.getDate()) &&
    months.includes(date.getMonth() + 1) &&
    dows.includes(date.getDay())
  );
}

export function computeNextRunAt(cron: string, from: Date): string | null {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return null;
  }
  const [minField, hourField, domField, monField, dowField] = fields;
  const minutes = parseCronField(minField, 0, 59);
  const hours = parseCronField(hourField, 0, 23);
  const doms = parseCronField(domField, 1, 31);
  const months = parseCronField(monField, 1, 12);
  const dows = parseCronField(dowField, 0, 6);

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
      !doms.includes(day.getDate()) ||
      !months.includes(day.getMonth() + 1) ||
      !dows.includes(day.getDay())
    ) {
      if (dayOffset > 0) {
        continue;
      }
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

export function validateCron(cron: string): boolean {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }

  const limits: [number, number][] = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 6],
  ];

  return fields.every((field, i) => parseCronField(field, limits[i][0], limits[i][1]) !== null);
}
