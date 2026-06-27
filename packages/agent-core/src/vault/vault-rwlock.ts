export interface ReadWriteLock {
  readLock(): Promise<void>;
  readUnlock(): Promise<void>;
  writeLock(): Promise<void>;
  writeUnlock(): Promise<void>;
}

export class SimpleReadWriteLock implements ReadWriteLock {
  private readers = 0;
  private writer = false;
  private readQueue: (() => void)[] = [];
  private writeQueue: (() => void)[] = [];

  async readLock(): Promise<void> {
    if (this.writer || this.writeQueue.length > 0) {
      await new Promise<void>((resolve) => {
        this.readQueue.push(resolve);
      });
    }
    this.readers++;
  }

  async readUnlock(): Promise<void> {
    this.readers--;
    if (this.readers === 0 && this.writeQueue.length > 0) {
      const next = this.writeQueue.shift()!;
      next();
    }
  }

  async writeLock(): Promise<void> {
    if (this.writer || this.readers > 0) {
      await new Promise<void>((resolve) => {
        this.writeQueue.push(resolve);
      });
    }
    this.writer = true;
  }

  async writeUnlock(): Promise<void> {
    this.writer = false;
    if (this.writeQueue.length > 0) {
      const next = this.writeQueue.shift()!;
      next();
    } else if (this.readQueue.length > 0) {
      const resolvers = this.readQueue.splice(0, this.readQueue.length);
      for (const resolve of resolvers) {
        resolve();
      }
    }
  }
}
