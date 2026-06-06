export function getToolDefinitionsPart3() {
  return [
    {
      name: 'browser_sequence',
      description:
        'Execute actions in sequence. Prefer browser_script which finds elements at runtime.',
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
      name: 'browser_get_text',
      description: 'Get text content or input value from an element.',
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
      description: 'Check if an element is visible on the page. Returns true/false.',
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
      description: 'Check if an element is enabled. Returns true/false.',
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
      description: 'Check if a checkbox or radio button is checked. Returns true/false.',
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
          ref: { type: 'string', description: 'Element ref to scroll into view' },
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
      name: 'browser_wait',
      description: 'Wait for a condition. browser_script has built-in alternatives.',
      inputSchema: {
        type: 'object',
        properties: {
          condition: {
            type: 'string',
            enum: ['selector', 'hidden', 'navigation', 'network_idle', 'timeout', 'function'],
            description: 'Condition type to wait for.',
          },
          selector: {
            type: 'string',
            description: 'CSS selector (required for "selector" and "hidden" conditions)',
          },
          script: {
            type: 'string',
            description: 'JavaScript expression (required for "function" condition)',
          },
          timeout: { type: 'number', description: 'Max wait time in ms (default: 30000)' },
          page_name: { type: 'string', description: 'Optional page name (default: "main")' },
        },
        required: ['condition'],
      },
    },
  ];
}
