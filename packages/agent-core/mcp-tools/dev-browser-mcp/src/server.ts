import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  handleBrowserFileUpload,
  handleBrowserGetText,
  handleBrowserKeyboard,
  handleBrowserSelect,
  handleBrowserType,
} from './handler-input.js';
import {
  handleBrowserCanvasType,
  handleBrowserClick,
  handleBrowserDrag,
  handleBrowserHover,
} from './handler-interaction.js';
import {
  handleBrowserNavigate,
  handleBrowserPages,
  handleBrowserTabs,
} from './handler-navigation.js';
import {
  handleBrowserIframe,
  handleBrowserIsChecked,
  handleBrowserIsEnabled,
  handleBrowserIsVisible,
  handleBrowserScroll,
  handleBrowserWait,
} from './handler-query.js';
import {
  handleBrowserBatchActions,
  handleBrowserEvaluate,
  handleBrowserScript,
  handleBrowserSequence,
} from './handler-script.js';
import {
  handleBrowserHighlight,
  handleBrowserScreenshot,
  handleBrowserSnapshot,
} from './handler-snapshot.js';
import { getPage, getToolDebug } from './session-manager.js';
import { getAISnapshot } from './snapshot-manager.js';
import { getToolDefinitions } from './tool-definitions.js';

const server = new Server(
  { name: 'dev-browser-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolDefinitions(),
}));

const handlerMap: Record<string, (args: unknown) => Promise<CallToolResult>> = {
  browser_navigate: handleBrowserNavigate,
  browser_snapshot: handleBrowserSnapshot,
  browser_click: handleBrowserClick,
  browser_type: handleBrowserType,
  browser_screenshot: handleBrowserScreenshot,
  browser_evaluate: handleBrowserEvaluate,
  browser_pages: handleBrowserPages,
  browser_keyboard: handleBrowserKeyboard,
  browser_sequence: handleBrowserSequence,
  browser_script: handleBrowserScript,
  browser_scroll: handleBrowserScroll,
  browser_hover: handleBrowserHover,
  browser_select: handleBrowserSelect,
  browser_wait: handleBrowserWait,
  browser_file_upload: handleBrowserFileUpload,
  browser_drag: handleBrowserDrag,
  browser_get_text: handleBrowserGetText,
  browser_is_visible: handleBrowserIsVisible,
  browser_is_enabled: handleBrowserIsEnabled,
  browser_is_checked: handleBrowserIsChecked,
  browser_iframe: handleBrowserIframe,
  browser_tabs: handleBrowserTabs,
  browser_canvas_type: handleBrowserCanvasType,
  browser_highlight: handleBrowserHighlight,
  browser_batch_actions: handleBrowserBatchActions,
};

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  console.error(`[MCP] Tool called: ${name}`);

  const toolDebug = getToolDebug();
  const debugContext = { getPage, getAISnapshot: toolDebug?.getAISnapshot ?? getAISnapshot };
  let preCapture: unknown;
  if (toolDebug?.handlePreAction) {
    try {
      preCapture = await toolDebug.handlePreAction(name, args, debugContext);
    } catch (err) {
      console.error('[dev-browser-mcp] debugPreAction error:', err);
    }
  }

  const handler = handlerMap[name];
  if (!handler) {
    return { content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }], isError: true };
  }

  let result: CallToolResult;
  try {
    result = await handler(args);
  } catch (error) {
    result = {
      content: [
        { type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` },
      ],
      isError: true,
    };
  }

  if (toolDebug?.handlePostAction) {
    try {
      result = await toolDebug.handlePostAction(name, args, result, preCapture, debugContext);
    } catch (err) {
      console.error('[dev-browser-mcp] debugPostAction error:', err);
    }
  }

  return result;
});

export { server };
