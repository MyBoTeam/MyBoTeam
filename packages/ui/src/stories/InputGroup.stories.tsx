import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { InputGroup } from '../components/input-group';

const meta = {
  title: 'UI/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup>
      <Input placeholder="Search..." className="rounded-r-none border-r-0" />
      <Button className="rounded-l-none">Search</Button>
    </InputGroup>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <InputGroup data-testid="input-group">
      <Input placeholder="Check" />
    </InputGroup>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const group = canvas.getByTestId('input-group');
    await expect(group).toBeVisible();
  },
};
