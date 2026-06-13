import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert as GlassAlert,
  AlertDescription as GlassAlertDescription,
  AlertTitle as GlassAlertTitle,
} from '../components/alert';
import { Avatar as GlassAvatar, AvatarFallback as GlassAvatarFallback } from '../components/avatar';
import { Badge as GlassBadge } from '../components/badge';
import { Button as GlassButton } from '../components/button';
import {
  Card as GlassCard,
  CardContent as GlassCardContent,
  CardDescription as GlassCardDescription,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
} from '../components/card';
import {
  Dialog as GlassDialog,
  DialogContent as GlassDialogContent,
  DialogTrigger as GlassDialogTrigger,
} from '../components/dialog';
import {
  DropdownMenu as GlassDropdownMenu,
  DropdownMenuContent as GlassDropdownMenuContent,
  DropdownMenuItem as GlassDropdownMenuItem,
  DropdownMenuTrigger as GlassDropdownMenuTrigger,
} from '../components/dropdown-menu';
import { Input as GlassInput } from '../components/input';
import { Label as GlassLabel } from '../components/label';
import { ScrollArea as GlassScrollArea } from '../components/scroll-area';
import { Separator as GlassSeparator } from '../components/separator';
import { Skeleton as GlassSkeleton } from '../components/skeleton';
import { Switch as GlassSwitch } from '../components/switch';
import {
  Tabs as GlassTabs,
  TabsContent as GlassTabsContent,
  TabsList as GlassTabsList,
  TabsTrigger as GlassTabsTrigger,
} from '../components/tabs';
import { Textarea as GlassTextarea } from '../components/textarea';
import {
  Tooltip as GlassTooltip,
  TooltipContent as GlassTooltipContent,
  TooltipProvider as GlassTooltipProvider,
  TooltipTrigger as GlassTooltipTrigger,
} from '../components/tooltip';

const meta = {
  title: 'Glass/All Variants',
  component: GlassCard,
  tags: ['autodocs'],
} satisfies Meta<typeof GlassCard>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Button</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-wrap gap-2">
          <GlassButton effect="glow">Glow</GlassButton>
          <GlassButton effect="lift">Lift</GlassButton>
          <GlassButton effect="scale">Scale</GlassButton>
          <GlassButton effect="shimmer">Shimmer</GlassButton>
          <GlassButton effect="ripple">Ripple</GlassButton>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Badge</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-wrap gap-2">
          <GlassBadge glow>Glow Badge</GlassBadge>
          <GlassBadge variant="secondary">Secondary</GlassBadge>
          <GlassBadge variant="outline">Outline</GlassBadge>
          <GlassBadge variant="destructive">Destructive</GlassBadge>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Avatar</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-wrap items-center gap-3">
          <GlassAvatar glow>
            <GlassAvatarFallback>AB</GlassAvatarFallback>
          </GlassAvatar>
          <GlassAvatar>
            <GlassAvatarFallback>CD</GlassAvatarFallback>
          </GlassAvatar>
          <GlassAvatar size="lg" glow>
            <GlassAvatarFallback>EF</GlassAvatarFallback>
          </GlassAvatar>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Input</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-3">
          <GlassLabel>Default Input</GlassLabel>
          <GlassInput placeholder="Type something..." />
          <GlassLabel>With Error</GlassLabel>
          <GlassInput placeholder="Invalid" error />
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Switch</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-wrap gap-4">
          <GlassSwitch glow />
          <GlassSwitch />
          <GlassSwitch glow defaultChecked />
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Tabs</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassTabs defaultValue="a">
            <GlassTabsList glow>
              <GlassTabsTrigger value="a">Tab A</GlassTabsTrigger>
              <GlassTabsTrigger value="b">Tab B</GlassTabsTrigger>
            </GlassTabsList>
            <GlassTabsContent value="a" className="pt-2">
              Tab A content
            </GlassTabsContent>
            <GlassTabsContent value="b" className="pt-2">
              Tab B content
            </GlassTabsContent>
          </GlassTabs>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Alert</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-2">
          <GlassAlert glow>
            <GlassAlertTitle>Info Alert</GlassAlertTitle>
            <GlassAlertDescription>This alert has a glow effect.</GlassAlertDescription>
          </GlassAlert>
          <GlassAlert>
            <GlassAlertTitle>Standard</GlassAlertTitle>
            <GlassAlertDescription>Standard glass alert without glow.</GlassAlertDescription>
          </GlassAlert>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Skeleton</GlassCardTitle>
          <GlassCardDescription>Shimmer loading placeholders</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-2">
          <GlassSkeleton className="h-4 w-full" />
          <GlassSkeleton className="h-4 w-3/4" />
          <GlassSkeleton className="h-8 w-full rounded-md" />
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Textarea</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassTextarea placeholder="Type a message..." />
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Separator</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-2">
          <p className="text-sm">Above</p>
          <GlassSeparator glow />
          <p className="text-sm">Below</p>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass ScrollArea</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassScrollArea glow className="h-24 rounded-md border">
            <div className="p-2">
              {Array.from({ length: 8 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                <p key={i} className="text-sm pb-1">
                  Item {i + 1}
                </p>
              ))}
            </div>
          </GlassScrollArea>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Dialog</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassDialog>
            <GlassDialogTrigger asChild>
              <GlassButton>Open Dialog</GlassButton>
            </GlassDialogTrigger>
            <GlassDialogContent>
              <p className="text-sm">Glass dialog content with backdrop blur.</p>
            </GlassDialogContent>
          </GlassDialog>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Dropdown</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassDropdownMenu>
            <GlassDropdownMenuTrigger asChild>
              <GlassButton>Menu</GlassButton>
            </GlassDropdownMenuTrigger>
            <GlassDropdownMenuContent glow>
              <GlassDropdownMenuItem>Option 1</GlassDropdownMenuItem>
              <GlassDropdownMenuItem>Option 2</GlassDropdownMenuItem>
              <GlassDropdownMenuItem>Option 3</GlassDropdownMenuItem>
            </GlassDropdownMenuContent>
          </GlassDropdownMenu>
        </GlassCardContent>
      </GlassCard>

      <GlassCard className="p-4">
        <GlassCardHeader>
          <GlassCardTitle>Glass Tooltip</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassTooltipProvider>
            <GlassTooltip>
              <GlassTooltipTrigger asChild>
                <GlassButton>Hover</GlassButton>
              </GlassTooltipTrigger>
              <GlassTooltipContent glow>Glass tooltip content</GlassTooltipContent>
            </GlassTooltip>
          </GlassTooltipProvider>
        </GlassCardContent>
      </GlassCard>
    </div>
  ),
};
