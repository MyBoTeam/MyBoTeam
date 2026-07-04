# Quickstart: Local LLM Provider (Ollama/LMStudio)

**Feature**: 010-local-llm-provider  
**Date**: 2026-07-02  
**Status**: Complete

## Prerequisites

1. **Local LLM Provider Running**
   - Ollama: Install from https://ollama.com and start the server
   - LMStudio: Install from https://lmstudio.ai and start the server in LAN mode

2. **MyBot Development Environment**
   - Node.js 18+ installed
   - pnpm installed
   - Repository cloned and dependencies installed

## Quick Setup

### Option 1: Manual Configuration

1. **Start your local LLM provider**
   ```bash
   # For Ollama
   ollama serve
   
   # For LMStudio
   # Start LMStudio and enable LAN mode in settings
   ```

2. **Configure provider in MyBot**
   - Open MyBot settings
   - Navigate to Providers section
   - Click "Add Provider"
   - Enter provider details:
     - Name: `my-ollama` (or any unique name)
     - Type: `ollama` or `lmstudio`
     - Endpoint: `http://localhost:11434` (Ollama) or `http://localhost:1234` (LMStudio)
     - API Key: (optional, leave blank for local)
   - Click "Test Connection"
   - Click "Save"

3. **Verify configuration**
   - Provider should show as "Connected"
   - Available models should be listed
   - Try a test chat completion

### Option 2: Auto-Discovery

1. **Start your local LLM provider**
   ```bash
   # For Ollama
   ollama serve
   
   # For LMStudio
   # Start LMStudio and enable LAN mode in settings
   ```

2. **Open MyBot settings**
   - Navigate to Providers section
   - Click "Discover Providers"
   - System will scan common ports (11434, 1234)
   - Discovered providers will appear in the list

3. **Select discovered provider**
   - Click on discovered provider
   - Enter a name for the provider
   - Click "Add Provider"
   - Provider is now configured

## Usage Examples

### Chat Completion

```typescript
import { ProviderClient } from '@myboteam/agent-core';

// Get configured provider
const provider: ProviderClient = getProvider('my-ollama');

// Send chat completion request
const response = await provider.chatCompletion({
  model: 'llama3',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
});

console.log(response.message.content);
// "Hello! I'm doing well, thank you for asking..."
```

### Streaming Response

```typescript
// Stream chat response
const stream = provider.streamChat({
  model: 'llama3',
  messages: [
    { role: 'user', content: 'Tell me a story' }
  ],
});

for await (const chunk of stream) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
// "Once upon a time, in a land far away..."
```

### List Available Models

```typescript
// List available models
const models = await provider.listModels();

console.log(models);
// [
//   { id: 'llama3', name: 'Llama 3 8B', provider: 'ollama', ... },
//   { id: 'mistral', name: 'Mistral 7B', provider: 'ollama', ... },
// ]
```

### Auto-Discovery

```typescript
import { discoverProviders } from '@myboteam/agent-core';

// Discover running providers
const discovered = await discoverProviders();

console.log(discovered);
// [
//   { type: 'ollama', port: 11434, available: true, models: [...] },
//   { type: 'lmstudio', port: 1234, available: false },
// ]
```

## Troubleshooting

### Provider Not Connecting

1. **Check provider is running**
   ```bash
   # For Ollama
   curl http://localhost:11434/v1/models
   
   # For LMStudio
   curl http://localhost:1234/v1/models
   ```

2. **Check firewall settings**
   - Ensure port 11434 (Ollama) or 1234 (LMStudio) is not blocked

3. **Check provider logs**
   - Ollama: Check terminal output where `ollama serve` is running
   - LMStudio: Check LMStudio application logs

### Model Not Found

1. **Verify model is downloaded**
   ```bash
   # For Ollama
   ollama list
   
   # For LMStudio
   # Check loaded models in LMStudio UI
   ```

2. **Check model name**
   - Use exact model ID from provider
   - Case-sensitive

### Streaming Issues

1. **Check provider supports streaming**
   - Most local providers support streaming by default
   - Verify in provider settings

2. **Check timeout settings**
   - Increase timeout if response is slow
   - Default: 120 seconds

## Performance Tips

1. **Use appropriate model size**
   - Smaller models (7B) are faster but less capable
   - Larger models (13B+) are slower but more capable

2. **Monitor resource usage**
   - Check CPU/RAM usage during inference
   - Adjust model size based on available resources

3. **Use streaming for better UX**
   - Streaming provides faster perceived response time
   - Users see tokens as they are generated

## Next Steps

- Configure multiple providers for fallback
- Set up provider-specific options (temperature, top_p, etc.)
- Integrate with MyBot's chat interface
- Monitor provider performance metrics
