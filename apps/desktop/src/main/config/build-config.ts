export {
  getAppTier,
  isAnalyticsEnabled,
  isAutoUpdaterEnabled,
  isFreeMode,
} from './build-config-checks';
export type { BuildConfig } from './build-config-load';
export { getBuildConfig, loadBuildConfig } from './build-config-load';
export { getBuildId } from './build-id';
