import type { Preview } from '@storybook/react-vite';
import React from 'react';

// Import package CSS
import '../src/styles/tokens.css';
import '../src/styles/themes.css';
import '../src/styles/glass.css';

const preview: Preview = {
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
  },

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
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
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      React.useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      }, [theme]);
      return <Story />;
    },
  ],
};

// biome-ignore lint/style/noDefaultExport: Storybook requires default export
export default preview;
