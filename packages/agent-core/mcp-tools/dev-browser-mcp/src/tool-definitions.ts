import { getToolDefinitionsAdditional } from './tool-definitions-additional.js';
import { getToolDefinitionsPart3 } from './tool-definitions-part3.js';

const CORE_TOOLS = [
  {
    name: 'browser_navigate',
    description:
      "Navigate to a URL. For multi-step workflows, use browser_script instead - it's 5-10x faster.",
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to (e.g., "https://google.com" or "google.com")',
        },
        page_name: { type: 'string', description: 'Optional name for the page (default: "main")' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description:
      'Get ARIA accessibility tree with element refs like [ref=e5]. browser_script auto-returns a snapshot.',
    inputSchema: {
      type: 'object',
      properties: {
        page_name: {
          type: 'string',
          description: 'Optional name of the page to snapshot (default: "main")',
        },
        interactive_only: {
          type: 'boolean',
          description: 'If true, only show interactive elements. Default: true.',
        },
        full_snapshot: {
          type: 'boolean',
          description: 'Force a complete snapshot instead of a diff. Default: false.',
        },
        max_elements: {
          type: 'number',
          description: 'Maximum elements to include (1-1000). Default: 300',
        },
        viewport_only: {
          type: 'boolean',
          description: 'Only include elements visible in viewport.',
        },
        include_history: {
          type: 'boolean',
          description: 'Include navigation history. Default: true',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum estimated tokens (1000-50000). Default: 8000',
        },
      },
    },
  },
  {
    name: 'browser_click',
    description:
      'Click on the page. For multi-step workflows, use browser_script with findAndClick instead.',
    inputSchema: {
      type: 'object',
      properties: {
        position: {
          type: 'string',
          enum: ['center', 'center-lower'],
          description: '"center" clicks viewport center. "center-lower" clicks 2/3 down.',
        },
        x: { type: 'number', description: 'X coordinate in pixels from left.' },
        y: { type: 'number', description: 'Y coordinate in pixels from top.' },
        ref: { type: 'string', description: 'Element ref from browser_snapshot (e.g., "e5").' },
        selector: { type: 'string', description: 'CSS selector (e.g., "button.submit").' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          description: 'Mouse button (default: "left").',
        },
        click_count: {
          type: 'number',
          description: 'Number of clicks (default: 1). Use 2 for double-click.',
        },
        page_name: { type: 'string', description: 'Optional name of the page (default: "main")' },
      },
    },
  },
  {
    name: 'browser_type',
    description:
      'Type text into an input. For form filling, use browser_script with findAndFill instead.',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'Element ref from browser_snapshot (e.g., "e5").' },
        selector: { type: 'string', description: 'CSS selector (e.g., "input[name=search]").' },
        text: { type: 'string', description: 'The text to type into the field' },
        press_enter: {
          type: 'boolean',
          description: 'Whether to press Enter after typing (default: false)',
        },
        page_name: { type: 'string', description: 'Optional page name (default: "main")' },
      },
      required: ['text'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot. Prefer browser_script which auto-returns a snapshot.',
    inputSchema: {
      type: 'object',
      properties: {
        page_name: {
          type: 'string',
          description: 'Optional name of the page to screenshot (default: "main")',
        },
        full_page: {
          type: 'boolean',
          description: 'Capture full scrollable page (default: false)',
        },
      },
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute custom JavaScript in the page context.',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'JavaScript code to execute in the page. Use return to get a value.',
        },
        page_name: { type: 'string', description: 'Optional page name (default: "main")' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_pages',
    description: 'List all open pages or close a specific page.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'close'],
          description: '"list" to get all page names, "close" to close a specific page',
        },
        page_name: { type: 'string', description: 'Required when action is "close"' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_keyboard',
    description: 'Type text or press keys on the currently focused element.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to type.' },
        key: {
          type: 'string',
          description: 'Special key to press (e.g., "Enter", "Tab", "Escape").',
        },
        typing_delay: {
          type: 'number',
          description: 'Delay in ms between keystrokes (default: 20).',
        },
        page_name: { type: 'string', description: 'Optional page name (default: "main")' },
      },
    },
  },
];

export function getToolDefinitions() {
  return [...CORE_TOOLS, ...getToolDefinitionsAdditional(), ...getToolDefinitionsPart3()];
}
