import type { FileHandle } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';
import type { Socket } from 'node:net';
import { Logger } from './logger';
import type { ResourceCleanupHandler as IResourceCleanupHandler } from './shutdown-manager.interface';

/**
 * Resource Cleanup Handler
 *
 * Manages cleanup of IPC-related resources on shutdown.
 * Uses socket.destroy() pattern for immediate cleanup.
 */
export class ResourceCleanupHandler implements IResourceCleanupHandler {
  private sockets: Set<Socket> = new Set();
  private fileHandles: Set<FileHandle> = new Set();
  private tempFiles: Set<string> = new Set();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ResourceCleanupHandler');
  }

  /**
   * Clean up all IPC-related resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Starting resource cleanup');

    // Destroy all sockets immediately
    this.destroySockets();

    // Close all file handles
    await this.closeFileHandles();

    // Remove temp files
    await this.removeTempFiles();

    this.logger.info('Resource cleanup completed');
  }

  /**
   * Destroy all sockets immediately
   * Uses socket.destroy() pattern for immediate cleanup
   */
  destroySockets(): void {
    this.logger.info('Destroying sockets', { count: this.sockets.size });

    for (const socket of this.sockets) {
      try {
        socket.destroy();
      } catch (error) {
        this.logger.error('Failed to destroy socket', { error: (error as Error).message });
      }
    }

    this.sockets.clear();
  }

  /**
   * Close all file handles
   */
  async closeFileHandles(): Promise<void> {
    this.logger.info('Closing file handles', { count: this.fileHandles.size });

    const closePromises: Promise<void>[] = [];

    for (const handle of this.fileHandles) {
      closePromises.push(
        handle.close().catch((error) => {
          this.logger.error('Failed to close file handle', { error: (error as Error).message });
        }),
      );
    }

    await Promise.all(closePromises);
    this.fileHandles.clear();
  }

  /**
   * Check if a file handle is still open
   */
  isFileHandleOpen(handle: FileHandle): boolean {
    return this.fileHandles.has(handle);
  }

  /**
   * Get all registered file handles
   */
  getFileHandles(): FileHandle[] {
    return Array.from(this.fileHandles);
  }

  /**
   * Remove temporary files
   */
  async removeTempFiles(): Promise<void> {
    this.logger.info('Removing temp files', { count: this.tempFiles.size });

    const unlinkPromises: Promise<void>[] = [];

    for (const filePath of this.tempFiles) {
      unlinkPromises.push(
        unlink(filePath).catch((error) => {
          this.logger.error('Failed to remove temp file', {
            filePath,
            error: (error as Error).message,
          });
        }),
      );
    }

    await Promise.all(unlinkPromises);
    this.tempFiles.clear();
  }

  /**
   * Check if a temp file is registered
   */
  isTempFileRegistered(filePath: string): boolean {
    return this.tempFiles.has(filePath);
  }

  /**
   * Get all registered temp files
   */
  getTempFiles(): string[] {
    return Array.from(this.tempFiles);
  }

  /**
   * Register a socket for cleanup
   */
  registerSocket(socket: Socket): void {
    this.sockets.add(socket);
  }

  /**
   * Unregister a socket
   */
  unregisterSocket(socket: Socket): void {
    this.sockets.delete(socket);
  }

  /**
   * Register a file handle for cleanup
   */
  registerFileHandle(handle: FileHandle): void {
    this.fileHandles.add(handle);
  }

  /**
   * Unregister a file handle
   */
  unregisterFileHandle(handle: FileHandle): void {
    this.fileHandles.delete(handle);
  }

  /**
   * Register a temp file for cleanup
   */
  registerTempFile(filePath: string): void {
    this.tempFiles.add(filePath);
  }

  /**
   * Unregister a temp file
   */
  unregisterTempFile(filePath: string): void {
    this.tempFiles.delete(filePath);
  }

  /**
   * Get list of tracked resources
   */
  getResourceCounts(): {
    sockets: number;
    fileHandles: number;
    tempFiles: number;
  } {
    return {
      sockets: this.sockets.size,
      fileHandles: this.fileHandles.size,
      tempFiles: this.tempFiles.size,
    };
  }
}
