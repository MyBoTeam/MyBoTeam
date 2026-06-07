import { randomUUID } from 'node:crypto';

export let sessionId: string = '';
export let numericSessionId: number = 0;
export let sessionStartTime: number = 0;
export let sessionTaskCount: number = 0;

export function initSessionState(): void {
  sessionId = randomUUID();
  numericSessionId = Date.now();
  sessionStartTime = Date.now();
  sessionTaskCount = 0;
}

export function getAnalyticsSessionId(): string {
  return sessionId;
}

export function incrementTaskCount(): void {
  sessionTaskCount++;
}

export function getSessionTaskCount(): number {
  return sessionTaskCount;
}

export function getSessionDuration(): number {
  return Math.floor((Date.now() - sessionStartTime) / 1000);
}
