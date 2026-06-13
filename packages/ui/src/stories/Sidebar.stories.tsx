import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
} from '../components/sidebar';

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex h-96">
      <Sidebar className="border-r">
        <SidebarHeader>
          <h2 className="text-sm font-semibold">My App</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarItem active>Dashboard</SidebarItem>
          <SidebarItem>Settings</SidebarItem>
          <SidebarItem>Profile</SidebarItem>
          <SidebarItem>Billing</SidebarItem>
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground">Signed in as user</p>
        </SidebarFooter>
      </Sidebar>
    </div>
  ),
};

export const Glow: Story = {
  render: () => (
    <div className="flex h-96">
      <Sidebar glow className="border-r">
        <SidebarHeader>
          <h2 className="text-sm font-semibold">Glowing</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarItem active>Item</SidebarItem>
        </SidebarContent>
      </Sidebar>
    </div>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <Sidebar data-testid="sidebar" className="h-96 border-r">
      <SidebarHeader>Header</SidebarHeader>
    </Sidebar>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const sidebar = canvas.getByTestId('sidebar');
    await expect(sidebar).toBeVisible();
  },
};
