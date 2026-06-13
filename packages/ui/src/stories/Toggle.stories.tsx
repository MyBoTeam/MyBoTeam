import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold } from 'lucide-react';
import { Toggle } from '../components/toggle';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
  },
} satisfies Meta<typeof Toggle>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Bold',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Italic',
  },
};

export const WithIcon: Story = {
  args: {
    children: <Bold className="h-4 w-4" />,
    'aria-label': 'Toggle bold',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const Glow: Story = {
  args: {
    glow: true,
    children: 'Glow',
  },
};
