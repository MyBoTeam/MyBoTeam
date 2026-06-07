import type { TaskMessage } from '../types/task.js';

export function mergeTaskMessage(existing: TaskMessage, incoming: TaskMessage): TaskMessage {
  return {
    ...existing,
    ...incoming,
    timestamp: existing.timestamp,
    attachments: incoming.attachments ?? existing.attachments,
    toolInput: incoming.toolInput ?? existing.toolInput,
    toolName: incoming.toolName ?? existing.toolName,
    toolStatus: incoming.toolStatus ?? existing.toolStatus,
    modelId: incoming.modelId ?? existing.modelId,
    providerId: incoming.providerId ?? existing.providerId,
  };
}

export function upsertTaskMessages(
  existing: TaskMessage[],
  incoming: TaskMessage[],
): TaskMessage[] {
  if (incoming.length === 0) return existing;

  const idToIndex = new Map<string, number>();
  for (let i = 0; i < existing.length; i++) {
    const id = existing[i]?.id;
    if (id) idToIndex.set(id, i);
  }

  const result = [...existing];
  for (const incomingMsg of incoming) {
    const existingIdx = incomingMsg.id ? idToIndex.get(incomingMsg.id) : undefined;
    if (existingIdx !== undefined) {
      result[existingIdx] = mergeTaskMessage(result[existingIdx], incomingMsg);
    } else {
      if (incomingMsg.id) idToIndex.set(incomingMsg.id, result.length);
      result.push(incomingMsg);
    }
  }
  return result;
}
