import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../components/input';
import { Label } from '../components/label';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Enter your name" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="required-input">
        Required Field
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input id="required-input" placeholder="This field is required" />
    </div>
  ),
};
