import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="p-3">
        Account settings and profile information.
      </TabsContent>
      <TabsContent value="password" className="p-3">
        Change your password here.
      </TabsContent>
      <TabsContent value="settings" className="p-3">
        Application settings and preferences.
      </TabsContent>
    </Tabs>
  ),
};

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-80">
      <TabsList variant="line">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-3">
        Content for tab 1.
      </TabsContent>
      <TabsContent value="tab2" className="p-3">
        Content for tab 2.
      </TabsContent>
      <TabsContent value="tab3" className="p-3">
        Content for tab 3.
      </TabsContent>
    </Tabs>
  ),
};
