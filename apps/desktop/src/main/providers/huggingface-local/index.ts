/**
 * HuggingFace Local Provider
 *
 * Entry point for the local HuggingFace inference provider.
 * Exports server lifecycle and model management functions.
 */

export type { DownloadProgress, ProgressCallback } from './model-manager';

export {
  cancelDownload,
  deleteModel as deleteHuggingFaceModel,
  downloadModel,
  getCachePath,
  listCachedModels,
  SUGGESTED_MODELS,
  SUGGESTED_MODELS as HF_RECOMMENDED_MODELS,
} from './model-manager';
export {
  getServerStatus as getHuggingFaceServerStatus,
  startServer as startHuggingFaceServer,
  stopServer as stopHuggingFaceServer,
  testConnection as testHuggingFaceConnection,
} from './server';
