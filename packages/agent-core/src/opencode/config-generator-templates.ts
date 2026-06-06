import type { Skill } from '../common/types/skills.js';

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'zh-CN': '中文',
  ru: 'русский',
  fr: 'français',
};

export function getLanguageInstruction(language: string | undefined): string {
  if (!language || language === 'auto' || language === 'en') {
    return '';
  }
  const displayName = LANGUAGE_DISPLAY_NAMES[language];
  if (!displayName) {
    return '';
  }
  if (language === 'zh-CN') {
    return `#始终用${displayName}交流#`;
  }
  return `Always respond in ${displayName}`;
}

export function buildSkillsSection(skills: Skill[]): string {
  const skillsSection = `
\n
<available-skills>
##############################################################################
# SKILLS - Include relevant ones in your start_task call
##############################################################################

Review these skills and include any relevant ones in your start_task call's \`skills\` array.
After calling start_task, you MUST read the SKILL.md file for each skill you listed.

**Available Skills:**

${skills
  .map(
    (s) => `- **${s.name}** (${s.command}): ${s.description}
  File: ${s.filePath}`,
  )
  .join('\n\n')}

Use empty array [] if no skills apply to your task.

##############################################################################
</available-skills>
`;
  return skillsSection;
}

export function buildGwsSection(
  gwsAccountsSummary: Array<{ label: string; email: string; status: string }>,
): string {
  const sanitizeField = (v: string) =>
    v
      .replace(/\|/g, '\\|')
      .replace(/[\r\n]/g, ' ')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const accountRows = gwsAccountsSummary
    .map(
      (a) =>
        `| ${sanitizeField(a.label)} | ${sanitizeField(a.email)} | ${sanitizeField(a.status)} |`,
    )
    .join('\n');
  const gwsSection = `
\n
<google-workspace-accounts>
##############################################################################
# CONNECTED GOOGLE ACCOUNTS
##############################################################################

The user has connected the following Google accounts. Use the appropriate
account when performing Gmail or Calendar operations.

| Label | Email | Status |
|-------|-------|--------|
${accountRows}

**Routing rules:**
- For read operations (list, search, get, free-time): omit the \`account\` parameter to
  query ALL accounts simultaneously.
- For write operations (send, reply, create, update, delete): ALWAYS specify
  the \`account\` parameter. If the user does not specify which account to use,
  ask them before proceeding. Never guess.
- Address accounts by their Label (e.g. "Work") or full email address.
- If an account status is "expired", instruct the user to reconnect it in
  Settings → Integrations → Google Accounts.
- Do NOT fall back to browser automation when these MCP tools are available.

**Available Google Workspace tools:**
- \`google_gmail\` — Send, read, and manage Gmail messages (accepts \`account\`)
- \`google_calendar\` — Create, list, and update Calendar events (accepts \`account\`)
- \`google_sheets\` — Create/read/write Sheets spreadsheets (accepts \`account\`)
- \`google_docs\` — Create/read/write Docs documents (accepts \`account\`)
- \`google_slides\` — Create/read/write Slides presentations (accepts \`account\`)
- \`request_google_file_picker\` — Request access to Drive files (accepts \`account\`).
  Provide a \`query\` to search for already-accessible files first. If found, returns
  metadata directly without interrupting the user. If not found, pauses the task
  for the user to select files via the Google Picker.

##############################################################################
</google-workspace-accounts>
`;
  return gwsSection;
}

export function buildWorkspaceInstructions(instructions: string): string {
  return `<workspace-instructions>
##############################################################################
# MANDATORY WORKSPACE INSTRUCTIONS — MUST BE FOLLOWED
##############################################################################

The user has saved the following instructions for THIS SPECIFIC WORKSPACE.
These are PERSISTENT USER INSTRUCTIONS that apply to EVERY response in
this workspace, including:
- Short conversational replies — these instructions OVERRIDE the default
  "concise by default" / "1-3 sentences" / conversational-bypass rules
  described later in this prompt.
- Direct answers to simple questions.
- Task workflow responses.
- Tool-using multi-step tasks.

Follow each instruction below LITERALLY, on EVERY response, for the
duration of this workspace session. When two instructions conflict,
prefer the most recently added one. These instructions take precedence
over any response-style defaults in the rest of this prompt, except
where they would conflict with a higher-priority safety or system rule.

${instructions}

##############################################################################
</workspace-instructions>

`;
}

export function buildWorkspaceKnowledge(knowledge: string): string {
  return `\n
\n
<workspace-knowledge>
##############################################################################
# WORKSPACE KNOWLEDGE - Persistent context for this workspace
##############################################################################

The user has saved the following background context for this workspace.
Use this information to inform your work. Do not ask the user to
re-explain anything covered here.

${knowledge}

##############################################################################
</workspace-knowledge>
`;
}
