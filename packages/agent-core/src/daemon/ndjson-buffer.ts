/**
 * NdjsonBuffer - Shared NDJSON framing buffer for parsing newline-delimited JSON.
 * Handles chunked data and splits into complete lines.
 *
 * Source: Extracted from rpc-server.ts and socket-transport.ts
 */

export class NdjsonBuffer {
  private buffer = '';
  private readonly maxSize: number;

  constructor(maxSize: number = 1_048_576) {
    this.maxSize = maxSize;
  }

  /**
   * Append a chunk and return all complete lines.
   * Returns null if buffer exceeds max size.
   */
  append(chunk: string): string[] | null {
    const nextBuffer = this.buffer + chunk;
    if (Buffer.byteLength(nextBuffer, 'utf8') > this.maxSize) {
      return null;
    }
    this.buffer = nextBuffer;

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    return lines;
  }

  /**
   * Get the current buffer size in bytes.
   */
  get size(): number {
    return Buffer.byteLength(this.buffer, 'utf8');
  }

  /**
   * Reset the buffer.
   */
  reset(): void {
    this.buffer = '';
  }
}
