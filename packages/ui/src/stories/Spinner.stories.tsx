import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '../components/spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Spinner>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Glow: Story = {
  args: {
    size: 'md',
    glow: true,
  },
};
