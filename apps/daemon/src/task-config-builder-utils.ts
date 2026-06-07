function getPort(envVar: string): number | undefined {
  const val = process.env[envVar];
  if (!val) {
    return undefined;
  }
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildConfigFileName(taskId: string | undefined): string | undefined {
  if (!taskId) {
    return undefined;
  }
  const safe = taskId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 128);
  if (!safe) {
    return undefined;
  }
  return `opencode-${safe}.json`;
}

export { buildConfigFileName, getPort };
