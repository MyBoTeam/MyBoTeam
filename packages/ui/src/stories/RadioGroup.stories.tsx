import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '../components/label';
import { RadioGroup, RadioGroupItem } from '../components/radio-group';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="option2" />
        <Label htmlFor="option2">Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="option3" />
        <Label htmlFor="option3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const Glow: Story = {
  render: () => (
    <RadioGroup defaultValue="a">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="a" glow />
        <Label htmlFor="a">Glowing option</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="x">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="x" id="x" disabled />
        <Label htmlFor="x" className="text-muted-foreground">
          Disabled
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <RadioGroup defaultValue="check" data-testid="radio-group">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="check" id="check" />
        <Label htmlFor="check">Check</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const group = canvas.getByTestId('radio-group');
    await expect(group).toBeVisible();
  },
};
