import { isProd } from '../config/env';

export const logger = {
  debug: (...args: any[]) => {
    if (!isProd) {
      console.log('[FE-DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.info('[FE-INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[FE-WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[FE-ERROR]', ...args);
  },
};
