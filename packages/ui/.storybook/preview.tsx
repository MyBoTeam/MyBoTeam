import type { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import React from 'react';

// Import package CSS
import '../src/styles/tokens.css';
import '../src/styles/themes.css';
import '../src/styles/glass.css';

import { TooltipProvider } from '../src/components/tooltip';

import { mswHandlers } from './msw-handlers';

initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },

    backgrounds: {
      disable: true,
    },

    msw: {
      handlers: mswHandlers,
    },
  },

  globalTypes: {
    mode: {
      name: 'Mode',
      description: 'Light or dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        showName: true,
      },
    },
    colorTheme: {
      name: 'Color Theme',
      description: 'Accent color theme',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'theme-mint', title: 'Mint' },
          { value: 'theme-blue', title: 'Blue' },
          { value: 'theme-lemon', title: 'Lemon' },
          { value: 'theme-peach', title: 'Peach' },
          { value: 'theme-lavender', title: 'Lavender' },
          { value: 'theme-neutral', title: 'Neutral' },
        ],
        showName: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const mode = context.globals.mode || 'light';
      const colorTheme = context.globals.colorTheme || 'default';
      React.useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        const themeClasses = [
          'theme-mint',
          'theme-blue',
          'theme-lemon',
          'theme-peach',
          'theme-lavender',
          'theme-neutral',
        ];
        root.classList.remove(...themeClasses);
        if (colorTheme !== 'default') {
          root.classList.add(colorTheme);
        }
        const bgValue =
          colorTheme !== 'default' ? 'var(--theme-bg-gradient)' : 'hsl(var(--background))';
        const styleId = 'storybook-theme-bg';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
          body, #storybook-root, .sbdocs-wrapper, .sbdocs-preview {
            background: ${bgValue} !important;
            background-size: cover !important;
          }
        `;
      }, [mode, colorTheme]);
      return (
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      );
    },
  ],
};

// biome-ignore lint/style/noDefaultExport: Storybook requires default export
export default preview;
