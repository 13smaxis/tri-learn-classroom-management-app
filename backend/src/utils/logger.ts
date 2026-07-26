const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

class Logger {
  private level = LOG_LEVELS[currentLevel];

  debug(message: string, data?: any) {
    if (this.level <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  error(message: string, error?: any) {
    if (this.level <= LOG_LEVELS.error) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}:`, error.message);
        console.error(error.stack);
      } else {
        console.error(`[ERROR] ${message}`, error ? JSON.stringify(error) : '');
      }
    }
  }
}

export const logger = new Logger();
