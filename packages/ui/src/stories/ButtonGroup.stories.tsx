import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';
import { ButtonGroup } from '../components/button-group';

const meta = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <ButtonGroup orientation="horizontal">
      <Button variant="outline" className="rounded-none rounded-l-md">
        Left
      </Button>
      <Button variant="outline" className="rounded-none">
        Center
      </Button>
      <Button variant="outline" className="rounded-none rounded-r-md">
        Right
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline" className="rounded-none rounded-t-md">
        Top
      </Button>
      <Button variant="outline" className="rounded-none">
        Middle
      </Button>
      <Button variant="outline" className="rounded-none rounded-b-md">
        Bottom
      </Button>
    </ButtonGroup>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <ButtonGroup data-testid="button-group" orientation="horizontal">
      <Button variant="outline" className="rounded-none rounded-l-md">
        A
      </Button>
      <Button variant="outline" className="rounded-none rounded-r-md">
        B
      </Button>
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const group = canvas.getByTestId('button-group');
    await expect(group).toBeVisible();
  },
};
