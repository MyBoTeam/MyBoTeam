#!/usr/bin/env node
/**
 * request-google-file-picker MCP server.
 *
 * Supports multi-account via GWS_ACCOUNTS_MANIFEST env var (manifest JSON
 * produced by AccountManager.writeAccountsManifest). The tool accepts an
 * optional `account` parameter (label or email) to search Drive files for
 * a specific account. When only one account is connected it is used automatically.
 *
 * Behaviour:
 * 1. If a `query` is provided, search for already-accessible Drive files in the
 *    resolved account. If exactly one match is found, return metadata directly
 *    (no picker needed). If multiple matches are found, pause for picker with query.
 * 2. If no query or no matches, emit GOOGLE_FILE_PICKER_MARKER to signal the
 *    desktop app to pause the task and open the Google Picker UI.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  formatFileList,
  GOOGLE_FILE_PICKER_MARKER,
  loadManifest,
  readAccessToken,
  resolveAccount,
  sanitizeMarkerValue,
  searchDriveFiles,
} from './picker-types.js';

// ── MCP server ────────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: 'request-google-file-picker', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.registerTool(
  'request_google_file_picker',
  {
    description:
      'Request access to Google Drive files. ' +
      'When a filename query is provided, searches for already-accessible files first and returns them directly. ' +
      'If no query is given or no accessible matches are found, pauses the task and shows the Google Picker for the user to select files.',
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe(
          'Filename to search for among already-accessible files. ' +
            'If a match is found, returns file metadata without showing the picker.',
        ),
      message: z
        .string()
        .optional()
        .describe(
          'Short explanation shown in chat before the file picker button. ' +
            'Explain why you need the user to select files.',
        ),
      label: z.string().optional().describe('Optional label for the in-chat button.'),
      pendingLabel: z
        .string()
        .optional()
        .describe('Optional label shown while the file picker is open.'),
      account: z
        .string()
        .optional()
        .describe(
          "Target a specific Google account by label (e.g. 'Work') or email. " +
            'When only one account is connected it is used automatically.',
        ),
    },
  },
  async ({ query, message, label, pendingLabel, account }) => {
    const accounts = loadManifest();
    const resolved = resolveAccount(accounts, account);
    if (resolved.error) {
      return { content: [{ type: 'text', text: resolved.error }], isError: true };
    }

    const accountEntry = resolved.entry;
    const accessToken = readAccessToken(accountEntry);

    // If a query is provided and we have a token, try to find already-accessible files first
    if (query?.trim() && accessToken) {
      try {
        const files = await searchDriveFiles(query.trim(), accessToken);

        if (files.length === 1) {
          return {
            content: [
              {
                type: 'text' as const,
                text:
                  `Found an accessible file matching "${query}" in ${accountEntry.label} (${accountEntry.email}):\n` +
                  formatFileList(files) +
                  '\n\nYou can use this file directly — no need for the user to pick it.',
              },
            ],
          };
        }

        if (files.length > 1) {
          // Multiple matches — trigger the picker pause so user can select
          return {
            content: [
              {
                type: 'text' as const,
                text: [
                  GOOGLE_FILE_PICKER_MARKER,
                  `Message: ${sanitizeMarkerValue(message ?? `Found ${files.length} files matching "${query}". Please select which file(s) to use.`)}`,
                  `Label: ${sanitizeMarkerValue(label?.trim() || 'Select Files')}`,
                  `PendingLabel: ${sanitizeMarkerValue(pendingLabel?.trim() || 'Selecting files...')}`,
                  `Query: ${sanitizeMarkerValue(query.trim())}`,
                  `Account: ${sanitizeMarkerValue(accountEntry.label)}`,
                  `AccountEmail: ${sanitizeMarkerValue(accountEntry.email)}`,
                ].join('\n'),
              },
            ],
          };
        }
      } catch {
        // Fall through to picker on any error
      }
    }

    // No query, no matches, or error — show the picker
    const lines = [
      GOOGLE_FILE_PICKER_MARKER,
      `Message: ${sanitizeMarkerValue(message ?? 'I need access to files in your Google Drive. Click Select Files to choose which files to share.')}`,
      `Label: ${sanitizeMarkerValue(label?.trim() || 'Select Files')}`,
      `PendingLabel: ${sanitizeMarkerValue(pendingLabel?.trim() || 'Selecting files...')}`,
      `Account: ${sanitizeMarkerValue(accountEntry.label)}`,
      `AccountEmail: ${sanitizeMarkerValue(accountEntry.email)}`,
    ];
    if (query?.trim()) {
      lines.push(`Query: ${sanitizeMarkerValue(query.trim())}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: lines.join('\n'),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[request-google-file-picker] MCP server running');
}

main().catch((error) => {
  console.error('[request-google-file-picker] Fatal error:', error);
  process.exit(1);
});
