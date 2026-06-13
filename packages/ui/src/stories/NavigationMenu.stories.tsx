import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../components/navigation-menu';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof NavigationMenu>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-2 p-4">
              <li>
                <NavigationMenuLink className="block rounded-md p-2 text-sm hover:bg-accent">
                  Installation
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="block rounded-md p-2 text-sm hover:bg-accent">
                  Configuration
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-2 p-4">
              <li>
                <NavigationMenuLink className="block rounded-md p-2 text-sm hover:bg-accent">
                  Button
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink className="block rounded-md p-2 text-sm hover:bg-accent">
                  Card
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
