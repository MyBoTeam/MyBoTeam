import type { ProviderId } from '@myboteam/agent-core/common';
import anthropicLogo from '/assets/ai-logos/anthropic.svg';
import azureLogo from '/assets/ai-logos/azure.svg';
import bedrockLogo from '/assets/ai-logos/bedrock.svg';
import copilotLogo from '/assets/ai-logos/copilot.svg';
import customLogo from '/assets/ai-logos/custom.svg';
import deepseekLogo from '/assets/ai-logos/deepseek.svg';
import fireworksLogo from '/assets/ai-logos/fireworks.svg';
import googleLogo from '/assets/ai-logos/google.svg';
import groqLogo from '/assets/ai-logos/groq.svg';
import huggingfaceLogo from '/assets/ai-logos/huggingface.svg';
import litellmLogo from '/assets/ai-logos/litellm.svg';
import lmstudioLogo from '/assets/ai-logos/lmstudio.png';
import minimaxLogo from '/assets/ai-logos/minimax.svg';
import moonshotLogo from '/assets/ai-logos/moonshot.svg';
import myboteamLogo from '/assets/ai-logos/myboteam.svg';
import nebiusLogo from '/assets/ai-logos/nebius.svg';
import nimLogo from '/assets/ai-logos/nim.svg';
import ollamaLogo from '/assets/ai-logos/ollama.svg';
import openaiLogo from '/assets/ai-logos/openai.svg';
import openrouterLogo from '/assets/ai-logos/openrouter.svg';
import togetherLogo from '/assets/ai-logos/together.svg';
import veniceLogo from '/assets/ai-logos/venice.svg';
import vertexLogo from '/assets/ai-logos/vertex.svg';
import xaiLogo from '/assets/ai-logos/xai.svg';
import zaiLogo from '/assets/ai-logos/zai.svg';

export const PROVIDER_LOGOS: Record<ProviderId, string> = {
  anthropic: anthropicLogo,
  openai: openaiLogo,
  google: googleLogo,
  xai: xaiLogo,
  deepseek: deepseekLogo,
  moonshot: moonshotLogo,
  zai: zaiLogo,
  bedrock: bedrockLogo,
  vertex: vertexLogo,
  'azure-foundry': azureLogo,
  ollama: ollamaLogo,
  openrouter: openrouterLogo,
  litellm: litellmLogo,
  minimax: minimaxLogo,
  lmstudio: lmstudioLogo,
  'huggingface-local': huggingfaceLogo,
  nebius: nebiusLogo,
  together: togetherLogo,
  fireworks: fireworksLogo,
  groq: groqLogo,
  venice: veniceLogo,
  nim: nimLogo,
  custom: customLogo,
  copilot: copilotLogo,
  'myboteam-ai': myboteamLogo,
};

export const DARK_INVERT_PROVIDERS = new Set<ProviderId>([
  'openai',
  'xai',
  'ollama',
  'openrouter',
  'together',
]);

export function getProviderLogo(providerId: ProviderId): string | undefined {
  return PROVIDER_LOGOS[providerId];
}
