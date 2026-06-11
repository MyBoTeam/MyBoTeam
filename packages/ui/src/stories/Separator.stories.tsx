import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '../components/ui/separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="w-80">
      <p className="text-sm">Above the separator</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Below the separator</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <div className="flex h-12 items-center gap-3">
      <p className="text-sm">Left</p>
      <Separator {...args} />
      <p className="text-sm">Right</p>
    </div>
  ),
};
