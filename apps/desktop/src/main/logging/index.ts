export { redact } from '@myboteam/agent-core/desktop-main';
export { getLogCollector, initializeLogCollector, shutdownLogCollector } from './log-collector';
export {
  getLogFileWriter,
  initializeLogFileWriter,
  type LogLevel,
  type LogSource,
  shutdownLogFileWriter,
} from './log-file-writer';
