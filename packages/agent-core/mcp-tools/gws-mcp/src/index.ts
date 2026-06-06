#!/usr/bin/env node
/**
 * GWS MCP server — Google Docs, Sheets, Slides via @googleworkspace/cli.
 *
 * Supports multi-account via GWS_ACCOUNTS_MANIFEST env var (manifest JSON
 * produced by AccountManager.writeAccountsManifest). Each tool accepts an
 * optional `account` parameter (label or email) to select which account's
 * token to use. When only one account is connected it is used automatically.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { ToolDef } from './gws-types.js';
import { loadManifest, resolveAccount, readToken, runGws } from './gws-utils.js';

// ── MCP server ────────────────────────────────────────────────────────────────

const SCOPE_NOTE =
  'Only operates on files created by this app or explicitly selected by the user via Google Picker. ' +
  'If a file returns 403/404, the user may need to grant access.';

const SERVICE_TOOLS: ToolDef[] = [
  {
    name: 'google_sheets',
    description:
      `Create, read, and write Google Sheets spreadsheets.\n` +
      `Create: google_sheets("spreadsheets create --json '{\\"properties\\": {\\"title\\": \\"My Sheet\\"}}'") → response has "spreadsheetId".\n` +
      `Add row: google_sheets("+append --spreadsheet '<ID>' --values 'Name,Score'")\n` +
      `Read: google_sheets("+read --spreadsheet '<ID>' --range 'Sheet1'")\n` +
      `${SCOPE_NOTE}`,
    servicePrefix: 'sheets',
  },
  {
    name: 'google_docs',
    description:
      `Create, read, and write Google Docs documents.\n` +
      `Create: google_docs("documents create --json '{\\"title\\": \\"My Doc\\"}'") → response has "documentId".\n` +
      `Write: google_docs("+write --document '<ID>' --text 'Hello world'")\n` +
      `Read: google_docs("documents get --params '{\\"documentId\\": \\"<ID>\\"}'") \n` +
      `${SCOPE_NOTE}`,
    servicePrefix: 'docs',
  },
  {
    name: 'google_slides',
    description:
      `Create, read, and write Google Slides presentations.\n` +
      `Create: google_slides("presentations create --json '{\\"title\\": \\"My Deck\\"}'") → response has "presentationId".\n` +
      `Read: google_slides("presentations get --params '{\\"presentationId\\": \\"<ID>\\"}'") to discover slide IDs.\n` +
      `${SCOPE_NOTE}`,
    servicePrefix: 'slides',
  },
];

const server = new McpServer(
  { name: 'gws-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

for (const tool of SERVICE_TOOLS) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: {
        command: z
          .string()
          .describe(
            `Arguments passed after "${tool.servicePrefix}" (the service prefix is added automatically).`,
          ),
        account: z
          .string()
          .optional()
          .describe(
            "Target a specific Google account by label (e.g. 'Work') or email. " +
              'When only one account is connected it is used automatically.',
          ),
      },
    },
    async ({ command, account }) => {
      const accounts = loadManifest();
      const resolved = resolveAccount(accounts, account);
      if (resolved.error) {
        return { content: [{ type: 'text', text: resolved.error }], isError: true };
      }

      let token: string;
      try {
        token = readToken(resolved.entry);
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to read token for ${resolved.entry.label}: ${String(err)}`,
            },
          ],
          isError: true,
        };
      }

      const fullCommand = `${tool.servicePrefix} ${command}`;
      try {
        const { stdout } = await runGws(fullCommand, token);
        const text = stdout || '(no output)';
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const is403or404 = /\b40[34]\b/.test(message);
        const hints: string[] = [];
        if (is403or404) {
          hints.push(
            'This file may not be accessible. Use Google Drive to share it with the connected account.',
          );
        }
        const suffix = hints.length > 0 ? `\n\n${hints.join('\n')}` : '';
        return {
          content: [{ type: 'text', text: `Error: ${message}${suffix}` }],
          isError: true,
        };
      }
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[gws-mcp] MCP server running');
}

main().catch((error) => {
  console.error('[gws-mcp] Fatal error:', error);
  process.exit(1);
});
