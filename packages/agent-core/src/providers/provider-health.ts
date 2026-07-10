import type { ProviderHealthStateInfo } from '@myboteam/types';
import { createChildLogger } from '../storage/logger.js';

const log = createChildLogger({ module: 'provider-health' });

const INITIAL_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 600_000;

export class ProviderHealthTracker {
  private readonly state = new Map<string, ProviderHealthStateInfo>();

  getState(providerId: string): ProviderHealthStateInfo {
    return this.state.get(providerId) ?? this.createDefaultState();
  }

  getAll(): Map<string, ProviderHealthStateInfo> {
    return new Map(this.state);
  }

  isSuccess(providerId: string): void {
    const current = this.getState(providerId);
    const now = new Date().toISOString();

    this.state.set(providerId, {
      state: 'healthy',
      failureCount: 0,
      lastSuccessAt: now,
      lastFailureAt: current.lastFailureAt,
      cooldownExpiresAt: undefined,
      cooldownStartedAt: undefined,
    });

    log.debug({ providerId }, 'Provider marked healthy');
  }

  isFailure(providerId: string): void {
    const current = this.getState(providerId);
    const now = new Date().toISOString();
    const newCount = current.failureCount + 1;

    if (newCount >= 3) {
      const cooldownMs = this.calculateCooldown(newCount);
      const cooldownExpiresAt = new Date(Date.now() + cooldownMs).toISOString();

      this.state.set(providerId, {
        state: 'cooldown',
        failureCount: newCount,
        lastFailureAt: now,
        lastSuccessAt: current.lastSuccessAt,
        cooldownExpiresAt,
        cooldownStartedAt: now,
      });

      log.warn(
        { providerId, failureCount: newCount, cooldownMs, cooldownExpiresAt },
        'Provider entered cooldown',
      );
    } else {
      this.state.set(providerId, {
        state: newCount >= 2 ? 'degraded' : 'healthy',
        failureCount: newCount,
        lastFailureAt: now,
        lastSuccessAt: current.lastSuccessAt,
        cooldownExpiresAt: undefined,
        cooldownStartedAt: undefined,
      });

      log.debug({ providerId, failureCount: newCount }, 'Provider failure recorded');
    }
  }

  canUse(providerId: string): boolean {
    const info = this.getState(providerId);

    if (info.state !== 'cooldown') {
      return true;
    }

    if (info.cooldownExpiresAt && new Date(info.cooldownExpiresAt) <= new Date()) {
      this.state.set(providerId, {
        ...info,
        state: 'degraded',
        failureCount: info.failureCount,
        cooldownExpiresAt: undefined,
        cooldownStartedAt: undefined,
      });
      log.debug({ providerId }, 'Cooldown expired, provider available');
      return true;
    }

    return false;
  }

  private calculateCooldown(failureCount: number): number {
    const cycles = failureCount - 2;
    const cooldown = INITIAL_COOLDOWN_MS * 2 ** cycles;
    return Math.min(cooldown, MAX_COOLDOWN_MS);
  }

  private createDefaultState(): ProviderHealthStateInfo {
    return {
      state: 'healthy',
      failureCount: 0,
    };
  }
}
