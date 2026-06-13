import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '../components/slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
};

export const Glow: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} max={100} step={1} glow />
    </div>
  ),
};
