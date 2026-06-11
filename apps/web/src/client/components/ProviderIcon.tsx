import type { ProviderType } from '@myboteam/agent-core/common';
import { cn } from '@/utils/utils';

interface ProviderIconProps {
  provider: ProviderType | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-[#D4A574]',
  openai: 'bg-[#10A37F]',
  google: 'bg-[#4285F4]',
  xai: 'bg-[#1DA1F2]',
  deepseek: 'bg-[#6366F1]',
  moonshot: 'bg-[#8B5CF6]',
  ollama: 'bg-[#F97316]',
  openrouter: 'bg-[#EC4899]',
  litellm: 'bg-[#06B6D4]',
  bedrock: 'bg-[#FF9900]',
  zai: 'bg-[#22C55E]',
  minimax: 'bg-[#EF4444]',
  lmstudio: 'bg-[#3B82F6]',
  'azure-foundry': 'bg-[#0078D4]',
  'huggingface-local': 'bg-[#FF9D00]',
  nebius: 'bg-[#7B61FF]',
  together: 'bg-[#0EA5E9]',
  fireworks: 'bg-[#EF4444]',
  groq: 'bg-[#F55036]',
  nim: 'bg-[#76B900]',
  custom: 'bg-[#6B7280]',
};

const PROVIDER_INITIALS: Record<string, string> = {
  anthropic: 'A',
  openai: 'G',
  google: 'G',
  xai: 'X',
  deepseek: 'D',
  moonshot: 'K',
  ollama: 'O',
  openrouter: 'R',
  litellm: 'L',
  bedrock: 'B',
  zai: 'Z',
  minimax: 'M',
  lmstudio: 'L',
  'azure-foundry': 'A',
  'huggingface-local': 'H',
  nebius: 'N',
  together: 'T',
  fireworks: 'F',
  groq: 'G',
  nim: 'N',
  custom: 'C',
};

const SIZE_CLASSES = {
  sm: 'w-4 h-4 text-[9px]',
  md: 'w-5 h-5 text-[10px]',
  lg: 'w-6 h-6 text-xs',
};

export function ProviderIcon({ provider, size = 'md', className }: ProviderIconProps) {
  const colorClass = provider
    ? PROVIDER_COLORS[provider] || PROVIDER_COLORS.custom
    : PROVIDER_COLORS.custom;
  const initial = provider ? PROVIDER_INITIALS[provider] || provider.charAt(0).toUpperCase() : '?';
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded font-semibold text-white flex-shrink-0',
        colorClass,
        sizeClass,
        className,
      )}
    >
      {initial}
    </div>
  );
}
