import type {
  FileOperation,
  PermissionOption,
  PermissionRequest,
} from '../../common/types/permission.js';
import type { FilePermissionRequestData, QuestionRequestData } from './permission-request-types.js';

export function buildFilePermissionRequest(
  requestId: string,
  taskId: string,
  data: FilePermissionRequestData,
): PermissionRequest {
  return {
    id: requestId,
    taskId,
    type: 'file',
    fileOperation: data.operation as FileOperation,
    filePath: data.filePath,
    filePaths: data.filePaths,
    targetPath: data.targetPath,
    contentPreview: data.contentPreview?.substring(0, 500),
    createdAt: new Date().toISOString(),
  };
}

export function buildQuestionRequest(
  requestId: string,
  taskId: string,
  data: QuestionRequestData,
): PermissionRequest {
  return {
    id: requestId,
    taskId,
    type: 'question',
    question: data.question,
    header: data.header,
    options: data.options as PermissionOption[],
    multiSelect: data.multiSelect,
    createdAt: new Date().toISOString(),
  };
}
