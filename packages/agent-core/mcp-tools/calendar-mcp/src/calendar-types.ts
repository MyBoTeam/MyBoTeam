export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inQuote = char;
      } else if (char === ' ' || char === '\t') {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export const CALENDAR_TOOL = {
  name: 'google_calendar',
  description:
    'Manage Google Calendar events across connected accounts. Supports listing, creating, updating, deleting events, responding to invitations, and finding free time slots.',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description:
          'Subcommand and flags. Examples: "list --start 2024-01-01T00:00:00Z --end 2024-01-07T00:00:00Z", "get <eventId>", "create --title Meeting --start 2024-01-02T10:00:00Z --end 2024-01-02T11:00:00Z", "update --eventId <id> --title NewTitle", "delete <eventId>", "rsvp --eventId <id> --status accepted", "free-time --start 2024-01-01T00:00:00Z --end 2024-01-07T00:00:00Z --duration 30"',
      },
      account: {
        type: 'string',
        description: 'Account label or email to use. Omit to query all accounts (read ops).',
      },
    },
    required: ['command'],
  },
};
