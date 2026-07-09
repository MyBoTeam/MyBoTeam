import type { ProviderClient } from '@myboteam/types';
import { createChildLogger } from '../storage/logger.js';

const log = createChildLogger({ module: 'provider-registry' });

export interface ProviderRegistryEntry {
  providerId: string;
  client: ProviderClient;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderRegistryEntry>();
  private nextPriority = 0;

  register(entry: Omit<ProviderRegistryEntry, 'priority'>): void {
    if (this.providers.has(entry.providerId)) {
      log.warn({ providerId: entry.providerId }, 'Provider already registered, overwriting');
    }

    this.providers.set(entry.providerId, {
      ...entry,
      priority: this.nextPriority++,
    });

    log.debug(
      { providerId: entry.providerId, name: entry.name, type: entry.type },
      'Provider registered',
    );
  }

  unregister(providerId: string): boolean {
    const existed = this.providers.delete(providerId);
    if (existed) {
      log.debug({ providerId }, 'Provider unregistered');
    }
    return existed;
  }

  get(providerId: string): ProviderRegistryEntry | undefined {
    return this.providers.get(providerId);
  }

  isEnabled(providerId: string): boolean {
    const entry = this.providers.get(providerId);
    return entry?.enabled ?? false;
  }

  enable(providerId: string): boolean {
    const entry = this.providers.get(providerId);
    if (!entry) return false;
    entry.enabled = true;
    return true;
  }

  disable(providerId: string): boolean {
    const entry = this.providers.get(providerId);
    if (!entry) return false;
    entry.enabled = false;
    return true;
  }

  getAll(): ProviderRegistryEntry[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  getEnabled(): ProviderRegistryEntry[] {
    return this.getAll().filter((e) => e.enabled);
  }

  getEnabledByIds(ids: string[]): ProviderRegistryEntry[] {
    return ids
      .map((id) => this.providers.get(id))
      .filter((e): e is ProviderRegistryEntry => e?.enabled === true);
  }

  get size(): number {
    return this.providers.size;
  }
}
