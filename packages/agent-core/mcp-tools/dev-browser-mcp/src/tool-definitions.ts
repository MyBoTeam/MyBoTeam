export function getToolDefinitions() {
  return [
    {
      name: 'browser_navigate',
      description:
        "Navigate to a URL. TIP: For multi-step workflows (navigate + fill + click), use browser_script instead - it's 5-10x faster.",
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to (e.g., "https://google.com" or "google.com")',
          },
          page_name: {
            type: 'string',
            description:
              'Optional name for the page (default: "main"). Use different names to manage multiple pages.',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'browser_snapshot',
      description:
        'Get ARIA accessibility tree with element refs like [ref=e5]. NOTE: browser_script auto-returns a snapshot, so you rarely need this separately.',
      inputSchema: {
        type: 'object',
        properties: {
          page_name: {
            type: 'string',
            description: 'Optional name of the page to snapshot (default: "main")',
          },
          interactive_only: {
            type: 'boolean',
            description:
              'If true, only show interactive elements (buttons, links, inputs, etc.). Default: true.',
          },
          full_snapshot: {
            type: 'boolean',
            description:
              'Force a complete snapshot instead of a diff. Use after major page changes (modal opened, dynamic content loaded) or when element refs seem incorrect. Default: false.',
          },
          max_elements: {
            type: 'number',
            description: 'Maximum elements to include (1-1000). Default: 300',
          },
          viewport_only: {
            type: 'boolean',
            description:
              'Only include elements visible in viewport. Defaults to true for coordinate-click apps (Gmail, Google Drive, etc.), otherwise false.',
          },
          include_history: {
            type: 'boolean',
            description: 'Include navigation history in output. Default: true',
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
        "Click on the page. TIP: For multi-step workflows, use browser_script with findAndClick instead - it's faster.",
      inputSchema: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            enum: ['center', 'center-lower'],
            description:
              '"center" clicks viewport center. "center-lower" clicks 2/3 down (preferred for Google Docs).',
          },
          x: { type: 'number', description: 'X coordinate in pixels from left.' },
          y: { type: 'number', description: 'Y coordinate in pixels from top.' },
          ref: { type: 'string', description: 'Element ref from browser_snapshot (e.g., "e5").' },
          selector: { type: 'string', description: 'CSS selector (e.g., "button.submit").' },
          button: {
            type: 'string',
            enum: ['left', 'right', 'middle'],
            description: 'Mouse button to click (default: "left"). Use "right" for context menus.',
          },
          click_count: {
            type: 'number',
            description:
              'Number of clicks (default: 1). Use 2 for double-click, 3 for triple-click.',
          },
          page_name: { type: 'string', description: 'Optional name of the page (default: "main")' },
        },
      },
    },
    {
      name: 'browser_type',
      description:
        "Type text into an input. TIP: For form filling, use browser_script with findAndFill instead - it's faster and finds elements at runtime.",
      inputSchema: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: 'Element ref from browser_snapshot (e.g., "e5"). Preferred over selector.',
          },
          selector: {
            type: 'string',
            description:
              'CSS selector to find the input (e.g., "input[name=search]"). Use ref when available.',
          },
          text: { type: 'string', description: 'The text to type into the field' },
          press_enter: {
            type: 'boolean',
            description: 'Whether to press Enter after typing (default: false)',
          },
          page_name: { type: 'string', description: 'Optional name of the page (default: "main")' },
        },
        required: ['text'],
      },
    },
    {
      name: 'browser_screenshot',
      description:
        'Take a screenshot. AVOID using this - browser_script auto-returns a snapshot which is faster and more useful. Only use screenshots to show the user what the page looks like.',
      inputSchema: {
        type: 'object',
        properties: {
          page_name: {
            type: 'string',
            description: 'Optional name of the page to screenshot (default: "main")',
          },
          full_page: {
            type: 'boolean',
            description:
              'Whether to capture the full scrollable page (default: false, captures viewport only)',
          },
        },
      },
    },
    {
      name: 'browser_evaluate',
      description:
        'Execute custom JavaScript in the page context. Use for advanced operations not covered by other tools.',
      inputSchema: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description:
              'JavaScript code to execute in the page. Must be plain JS (no TypeScript). Use return to get a value back.',
          },
          page_name: { type: 'string', description: 'Optional name of the page (default: "main")' },
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
          page_name: {
            type: 'string',
            description: 'Required when action is "close" - the name of the page to close',
          },
        },
        required: ['action'],
      },
    },
    {
      name: 'browser_keyboard',
      description:
        "Type text or press keys on the currently focused element. Use this for complex editors like Google Docs that don't have simple input elements. First click to focus, then use this to type.",
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to type. Each character is typed with proper key events.',
          },
          key: {
            type: 'string',
            description:
              'Special key to press (e.g., "Enter", "Tab", "Escape", "Backspace", "ArrowDown"). Can be combined with modifiers like "Control+a", "Shift+Enter".',
          },
          typing_delay: {
            type: 'number',
            description:
              'Delay in ms between keystrokes when typing text (default: 20). Set to 0 for instant typing.',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_sequence',
      description:
        'Execute actions in sequence. NOTE: browser_script is better - it finds elements at runtime and auto-returns snapshot. Use browser_sequence only if you already have refs.',
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
                  enum: ['click', 'type', 'snapshot', 'screenshot', 'wait'],
                },
                ref: { type: 'string' },
                selector: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                text: { type: 'string' },
                press_enter: { type: 'boolean' },
                full_page: { type: 'boolean' },
                timeout: { type: 'number' },
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
      name: 'browser_keyboard',
      description:
        'Send keyboard input. Use for shortcuts (Cmd+V, Ctrl+C), special keys (Enter, Tab, Escape), or typing into canvas apps like Google Docs where browser_type does not work.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['press', 'type', 'down', 'up'],
            description:
              '"press" for key combo (Enter, Meta+v), "type" for raw text character by character, "down"/"up" for hold/release',
          },
          key: {
            type: 'string',
            description:
              'Key to press: "Enter", "Tab", "Escape", "Meta+v", "Control+c", "Shift+ArrowDown"',
          },
          text: {
            type: 'string',
            description: 'Text to type character by character (for action="type")',
          },
          typing_delay: {
            type: 'number',
            description:
              'Delay in ms between keystrokes when typing text (default: 20). Set to 0 for instant typing.',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['action'],
      },
    },
    {
      name: 'browser_scroll',
      description: 'Scroll the page or scroll an element into view.',
      inputSchema: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['up', 'down', 'left', 'right'],
            description: 'Scroll direction',
          },
          amount: { type: 'number', description: 'Pixels to scroll (default: 500)' },
          ref: {
            type: 'string',
            description: 'Element ref to scroll into view (from browser_snapshot)',
          },
          selector: { type: 'string', description: 'CSS selector to scroll into view' },
          position: {
            type: 'string',
            enum: ['top', 'bottom'],
            description: 'Scroll to page top or bottom',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_hover',
      description: 'Hover over an element to trigger hover states, dropdowns, or tooltips.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector' },
          x: { type: 'number', description: 'X coordinate to hover at' },
          y: { type: 'number', description: 'Y coordinate to hover at' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_select',
      description:
        'Select an option from a <select> dropdown. Native select elements require this tool - browser_click will not work.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector for the select element' },
          value: { type: 'string', description: 'Option value attribute to select' },
          label: { type: 'string', description: 'Option visible text to select' },
          index: { type: 'number', description: 'Option index to select (0-based)' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_wait',
      description:
        'Wait for a condition. TIP: browser_script has built-in waitForLoad, waitForSelector, waitForNavigation - prefer using those.',
      inputSchema: {
        type: 'object',
        properties: {
          condition: {
            type: 'string',
            enum: ['selector', 'hidden', 'navigation', 'network_idle', 'timeout', 'function'],
            description:
              '"selector" waits for element to appear, "hidden" waits for element to disappear, "navigation" waits for page navigation, "network_idle" waits for network to settle, "timeout" waits fixed time, "function" waits for custom JS condition to return true',
          },
          selector: {
            type: 'string',
            description: 'CSS selector (required for "selector" and "hidden" conditions)',
          },
          script: {
            type: 'string',
            description:
              'JavaScript expression that returns true when condition is met (required for "function" condition)',
          },
          timeout: {
            type: 'number',
            description:
              'Max wait time in ms (default: 30000). For "timeout" condition, this is the wait duration.',
          },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['condition'],
      },
    },
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
      name: 'browser_get_text',
      description:
        "Get text content or input value from an element. Faster than browser_snapshot when you just need one element's text.",
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_is_visible',
      description:
        'Check if an element is visible on the page. Returns true/false. Use this to verify actions succeeded before proceeding.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_is_enabled',
      description:
        'Check if an element is enabled (not disabled). Returns true/false. Use to verify buttons/inputs are interactive.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
      },
    },
    {
      name: 'browser_is_checked',
      description:
        'Check if a checkbox or radio button is checked. Returns true/false. Use to verify form state.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Element ref from browser_snapshot' },
          selector: { type: 'string', description: 'CSS selector' },
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
      description:
        'Type text into canvas apps like Google Docs, Sheets, Figma. Clicks in the document, optionally jumps to start, then types.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to type' },
          position: {
            type: 'string',
            enum: ['start', 'current'],
            description:
              '"start" jumps to document beginning first (Cmd/Ctrl+Home), "current" types at current cursor position (default: "start")',
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
      description:
        'Toggle the visual highlight glow on the current tab. Use to indicate when automation is active on a tab, and turn off when done.',
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
