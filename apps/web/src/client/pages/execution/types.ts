export interface StartupStageInfo {
  stage: string;
  message: string;
  modelName?: string;
  isFirstTask: boolean;
  startTime: number;
}
