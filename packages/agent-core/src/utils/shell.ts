import * as fs from 'node:fs';

export function stripAnsi(input: string): string {
  return input.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export function quoteForShell(arg: string): string {
  if (process.platform === 'win32') {
    if (arg.includes(' ') || arg.includes('"')) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  }
  if (arg.includes("'") || arg.includes(' ') || arg.includes('"')) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
  return arg;
}

export function getPlatformShell(isPackaged?: boolean): string {
  if (process.platform === 'win32') {
    return 'powershell.exe';
  }
  if (isPackaged && process.platform === 'darwin') {
    return '/bin/sh';
  }
  const userShell = process.env.SHELL;
  if (userShell) return userShell;
  if (fs.existsSync('/bin/bash')) return '/bin/bash';
  if (fs.existsSync('/bin/zsh')) return '/bin/zsh';
  return '/bin/sh';
}

export function getShellArgs(command: string): string[] {
  if (process.platform === 'win32') {
    return ['-NoProfile', '-Command', command];
  }
  return ['-c', command];
}
