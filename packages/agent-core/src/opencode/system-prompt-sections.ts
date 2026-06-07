export function getPlatformEnvironmentInstructions(platform: NodeJS.Platform): string {
  if (platform === 'win32') {
    return `<environment>
**You are running on Windows.** Use Windows-compatible commands:
- Use PowerShell syntax, not bash/Unix syntax
- Use \`$env:TEMP\` for temp directory (not /tmp)
- Use semicolon (;) for PATH separator (not colon)
- Use \`$env:VAR\` for environment variables (not $VAR)
</environment>`;
  } else {
    return `<environment>
You are running on ${platform === 'darwin' ? 'macOS' : 'Linux'}.
</environment>`;
  }
}

export {
  CONVERSATIONAL_BYPASS_BEHAVIOR,
  FILE_PERMISSION_SECTION,
  TASK_COMPLETION_BEHAVIOR,
  TASK_PLANNING_BEHAVIOR,
} from './system-prompt-behaviors.js';
