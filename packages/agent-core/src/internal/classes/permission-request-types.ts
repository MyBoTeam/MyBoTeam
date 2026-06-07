export interface PendingRequest<T> {
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
}

export interface PermissionValidationResult {
  valid: boolean;
  error?: string;
}

export interface FilePermissionRequestData {
  operation?: string;
  filePath?: string;
  filePaths?: string[];
  targetPath?: string;
  contentPreview?: string;
}

export interface QuestionRequestData {
  question?: string;
  header?: string;
  options?: Array<{ label: string; description?: string }>;
  multiSelect?: boolean;
}

export interface QuestionResponseData {
  selectedOptions?: string[];
  customText?: string;
  denied?: boolean;
}
