export function getToolDefinitionsAdditional() {
  return [
    {
      name: 'browser_file_upload',
      description: 'Upload files to a file input element.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector for input[type=file]' },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of absolute file paths to upload',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['files'],
      },
    },
    {
      name: 'browser_drag',
      description: 'Drag and drop from source to target location.',
      inputSchema: {
        type: 'object',
        properties: {
          source_ref: { type: 'string', description: 'Source element ref from browser_snapshot' },
          source_selector: { type: 'string', description: 'Source CSS selector' },
          source_x: { type: 'number', description: 'Source X coordinate' },
          source_y: { type: 'number', description: 'Source Y coordinate' },
          target_ref: { type: 'string', description: 'Target element ref from browser_snapshot' },
          target_selector: { type: 'string', description: 'Target CSS selector' },
          target_x: { type: 'number', description: 'Target X coordinate' },
          target_y: { type: 'number', description: 'Target Y coordinate' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },

    {
      name: 'browser_iframe',
      description: 'Enter or exit an iframe to interact with its content.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['enter', 'exit'],
            description: '"enter" to switch into an iframe, "exit" to return to main page',
          },
          ref: { type: 'string', description: 'Iframe element ref (for action="enter")' },
          selector: { type: 'string', description: 'Iframe CSS selector (for action="enter")' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['action'],
      },
    },
    {
      name: 'browser_tabs',
      description: 'Manage browser tabs/popups. Handle new windows that open from clicks.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'switch', 'close', 'wait_for_new'],
            description:
              '"list" shows all tabs, "switch" to tab by index, "close" closes tab by index, "wait_for_new" waits for a popup',
          },
          index: { type: 'number', description: 'Tab index (0-based) for switch/close actions' },
          timeout: {
            type: 'number',
            description: 'Timeout in ms for wait_for_new (default: 5000)',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['action'],
      },
    },
    {
      name: 'browser_canvas_type',
      description: 'Type text into canvas apps like Google Docs, Sheets, Figma.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to type' },
          position: {
            type: 'string',
            enum: ['start', 'current'],
            description:
              '"start" jumps to document beginning, "current" types at cursor (default: "start")',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['text'],
      },
    },
    {
      name: 'browser_script',
      description: `⚡ PREFERRED: Execute complete browser workflows in ONE call. 5-10x faster than individual tools.
ALWAYS use this for multi-step tasks. Actions find elements at RUNTIME using CSS selectors.
Final page snapshot is AUTO-RETURNED - no need to add snapshot action.

Actions: goto, waitForLoad, waitForSelector, waitForNavigation, findAndFill, findAndClick, fillByRef, clickByRef, snapshot, screenshot, keyboard, evaluate`,
      inputSchema: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            description: 'Array of actions to execute in order',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: [
                    'goto',
                    'waitForLoad',
                    'waitForSelector',
                    'waitForNavigation',
                    'findAndFill',
                    'findAndClick',
                    'fillByRef',
                    'clickByRef',
                    'snapshot',
                    'screenshot',
                    'keyboard',
                    'evaluate',
                  ],
                },
                url: { type: 'string' },
                selector: { type: 'string' },
                ref: { type: 'string' },
                text: { type: 'string' },
                key: { type: 'string' },
                pressEnter: { type: 'boolean' },
                timeout: { type: 'number' },
                fullPage: { type: 'boolean' },
                code: { type: 'string' },
                skipIfNotFound: { type: 'boolean' },
              },
              required: ['action'],
            },
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['actions'],
      },
    },
    {
      name: 'browser_batch_actions',
      description: `Extract data from multiple URLs in ONE call. Visits each URL, runs your JS extraction script, returns compact JSON results.
Returns JSON only (no snapshots/screenshots) to minimize token usage. Max 20 URLs per call.`,
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of URLs to visit and extract data from (1-20 URLs)',
            maxItems: 20,
            minItems: 1,
          },
          extractScript: {
            type: 'string',
            description:
              'JavaScript code that extracts data from each page. Must return an object.',
          },
          waitForSelector: {
            type: 'string',
            description: 'Optional CSS selector to wait for before running extractScript.',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['urls', 'extractScript'],
      },
    },
    {
      name: 'browser_highlight',
      description: 'Toggle the visual highlight glow on the current tab.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'true to show the highlight glow, false to hide it',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['enabled'],
      },
    },
  ];
}
