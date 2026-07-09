# Quickstart: Custom Provider Configuration

## Prerequisites

- Node.js 18+ runtime
- Existing vault infrastructure configured
- Network access to custom LLM endpoints

## Installation

This feature is part of the `agent-core` package. No additional installation required.

## Basic Usage

### 1. Configure a Custom Provider

```typescript
import { CustomProviderService } from '@myboteam/agent-core';

const providerService = new CustomProviderService();

// Create a new provider configuration
const result = await providerService.createProvider({
  name: 'My OpenAI-Compatible API',
  url: 'https://api.example.com/v1',
  apiKey: 'sk-...',
  modelName: 'gpt-4',
});

if (result.success) {
  console.log('Provider configured:', result.provider.id);
} else {
  console.error('Configuration failed:', result.error);
}
```

### 2. Test Provider Connection

```typescript
// Test the connection
const testResult = await providerService.testConnection(provider.id);

if (testResult.success) {
  console.log('Connection successful');
  console.log('Available models:', testResult.result.models);
} else {
  console.error('Connection failed:', testResult.error);
}
```

### 3. List Configured Providers

```typescript
// List all active providers
const providers = await providerService.listProviders({ status: 'Active' });

providers.forEach(provider => {
  console.log(`Provider: ${provider.name} (${provider.url})`);
});
```

### 4. Update Provider Configuration

```typescript
// Update provider name
const updated = await providerService.updateProvider({
  providerId: provider.id,
  name: 'Updated Provider Name',
});
```

### 5. Disable/Enable Provider

```typescript
// Disable provider
await providerService.updateProvider({
  providerId: provider.id,
  status: 'Inactive',
});

// Re-enable provider
await providerService.updateProvider({
  providerId: provider.id,
  status: 'Active',
});
```

## Configuration Options

### Provider Limits

- **Maximum providers per user**: 50
- **Maximum API key length**: 1024 characters
- **Maximum URL length**: 2048 characters
- **Maximum model name length**: 256 characters

### Connection Test Settings

- **Default timeout**: 10 seconds
- **Maximum timeout**: 30 seconds
- **Retry attempts**: 1 (no automatic retries)

### Security Settings

- **API key encryption**: AES-256-GCM via vault
- **API key masking**: Always masked in logs and responses
- **HTTPS required**: Recommended for production use

## Error Handling

### Common Errors

1. **Invalid URL Format**
   ```typescript
   // Error: "Invalid URL format"
   // Solution: Ensure URL starts with http:// or https://
   ```

2. **Authentication Failed**
   ```typescript
   // Error: "Authentication required"
   // Solution: Verify API key is correct and not expired
   ```

3. **Connection Timeout**
   ```typescript
   // Error: "Connection timed out"
   // Solution: Check network connectivity and endpoint availability
   ```

4. **Rate Limited**
   ```typescript
   // Error: "Rate limited by provider"
   // Solution: Wait before retrying or contact provider
   ```

## Testing

### Unit Tests

```bash
# Run unit tests for custom provider
pnpm test -- --filter agent-core --testPathPattern="custom"
```

### Contract Tests

```bash
# Run contract tests for provider interface
pnpm test -- --filter agent-core --testPathPattern="contract"
```

### Integration Tests

```bash
# Run integration tests with vault
pnpm test -- --filter agent-core --testPathPattern="integration"
```

## Troubleshooting

### Provider Shows "Error" Status

1. Check network connectivity to endpoint
2. Verify API key is valid
3. Test endpoint manually with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://endpoint/v1/models
   ```

### API Key Not Encrypted

1. Verify vault infrastructure is configured
2. Check vault service is running
3. Review vault logs for encryption errors

### Connection Tests Always Fail

1. Check firewall rules
2. Verify DNS resolution
3. Test with different timeout values
4. Check provider status page

## Performance Notes

- **Configuration save/load**: < 100ms
- **Connection test**: < 10 seconds (configurable)
- **Provider list**: < 50ms for up to 50 providers
- **Memory usage**: < 10MB for 50 providers

## Security Notes

- API keys are never stored in plaintext
- API keys are masked in all logs and responses
- Connection tests use HTTPS when possible
- All inputs are validated and sanitized
- No sensitive data in error messages