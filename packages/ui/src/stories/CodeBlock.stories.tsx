import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from '../components/code-block';

const meta = {
  title: 'Custom/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  argTypes: {
    language: {
      control: 'select',
      options: ['typescript', 'javascript', 'html', 'css', 'json', 'bash', 'jsx', 'tsx'],
    },
  },
} satisfies Meta<typeof CodeBlock>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

const exampleCode = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet('World');
console.log(message);`;

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    children: exampleCode,
  },
};

export const Inline: Story = {
  render: () => (
    <p>
      You can use <CodeBlock inline>inline code</CodeBlock> within text.
    </p>
  ),
};

export const JsonExample: Story = {
  args: {
    language: 'json',
    children: JSON.stringify(
      {
        name: 'example',
        version: '1.0.0',
        dependencies: {
          react: '^19.0.0',
        },
      },
      null,
      2,
    ),
  },
};

export const Bash: Story = {
  args: {
    language: 'bash',
    children: 'npm install @myboteam/ui\npnpm dev\npnpm build',
  },
};
