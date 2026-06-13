import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../components/command';

const meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs'],
} satisfies Meta<typeof Command>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-80 rounded-lg border shadow-md">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Glow: Story = {
  render: () => (
    <Command glow className="w-80 rounded-lg border shadow-md">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandItem>Item with glow</CommandItem>
      </CommandList>
    </Command>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <Command data-testid="command" className="w-80 rounded-lg border shadow-md">
      <CommandInput placeholder="Search" />
      <CommandList>
        <CommandItem data-testid="command-item">Item</CommandItem>
      </CommandList>
    </Command>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const item = canvas.getByTestId('command-item');
    await expect(item).toBeVisible();
  },
};
