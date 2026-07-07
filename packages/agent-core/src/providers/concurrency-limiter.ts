export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      this.running++;
      const next = this.queue.shift();
      next?.();
    }
  }

  get available(): number {
    return this.maxConcurrent - this.running;
  }

  get pending(): number {
    return this.queue.length;
  }
}
