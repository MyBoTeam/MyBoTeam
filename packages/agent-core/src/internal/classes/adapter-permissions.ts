import type {
  PermissionRequest as OpenCodeSdkPermissionRequest,
  QuestionRequest as OpenCodeSdkQuestionRequest,
} from '@opencode-ai/sdk/v2';
import { CONNECTOR_AUTH_REQUIRED_MARKER } from '../../common/constants.js';
import { getOAuthProviderDisplayName, isOAuthProviderId } from '../../common/types/connector.js';
import type { PermissionRequest } from '../../common/types/permission.js';
import type { AdapterState } from './adapter-state.js';
import {
  buildPermissionToolInput,
  formatPermissionToolName,
  generateRequestId,
  inferFileOperation,
  inferFilePath,
  parseConnectorAuthPayload,
} from './adapter-utils.js';

export function handlePermissionAsked(
  state: AdapterState,
  sdkReq: OpenCodeSdkPermissionRequest,
): void {
  const requestId = generateRequestId('permission');
  state.pendingRequest = {
    kind: 'permission',
    requestId,
    sdkRequestId: sdkReq.id,
    sessionId: sdkReq.sessionID,
  };
  const fileOp = inferFileOperation(sdkReq);
  const filePath = inferFilePath(sdkReq);
  const req: PermissionRequest = {
    id: requestId,
    taskId: state.currentTaskId ?? '',
    type: fileOp ? 'file' : 'tool',
    toolName: formatPermissionToolName(sdkReq.permission),
    toolInput: buildPermissionToolInput(sdkReq),
    ...(fileOp ? { fileOperation: fileOp } : {}),
    ...(filePath ? { filePath } : {}),
    createdAt: new Date().toISOString(),
  };
  state.emit('permission-request', req);
}

export function handleQuestionAsked(state: AdapterState, sdkReq: OpenCodeSdkQuestionRequest): void {
  const requestId = generateRequestId('question');
  state.pendingRequest = {
    kind: 'question',
    requestId,
    sdkRequestId: sdkReq.id,
    sessionId: sdkReq.sessionID,
  };
  const first = sdkReq.questions?.[0];
  const req: PermissionRequest = {
    id: requestId,
    taskId: state.currentTaskId ?? '',
    type: 'question',
    question: first?.question,
    header: first?.header,
    options: first?.options?.map((o) => ({
      label: o.label,
      description: o.description,
    })),
    multiSelect: first?.multiple,
    createdAt: new Date().toISOString(),
  };
  state.emit('permission-request', req);
}

export function checkForConnectorAuthMarker(state: AdapterState, text: string): void {
  if (!text.includes(CONNECTOR_AUTH_REQUIRED_MARKER)) return;
  const payload = parseConnectorAuthPayload(text, CONNECTOR_AUTH_REQUIRED_MARKER);
  const providerId = payload?.providerId as string | undefined;
  if (providerId && isOAuthProviderId(providerId)) {
    state.emit('auth-error', {
      providerId,
      message:
        (payload?.message as string) ??
        `${getOAuthProviderDisplayName(providerId)} authentication required`,
    });
  }
}
