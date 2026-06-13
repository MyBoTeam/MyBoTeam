import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/collapsible';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger asChild>
        <Button variant="outline">Toggle Content</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-md border p-4">
        <p className="text-sm text-muted-foreground">
          This content can be toggled open and closed.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <Collapsible data-testid="collapsible" className="w-80">
      <CollapsibleContent>
        <p>Visible content</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const collapsible = canvas.getByTestId('collapsible');
    await expect(collapsible).toHaveTextContent('Visible content');
  },
};
