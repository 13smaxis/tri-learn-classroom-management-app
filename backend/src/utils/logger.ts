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

  private formatData(data?: unknown) {
    if (data === undefined) {
      return '';
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' || data === null) {
      return ` ${String(data)}`;
    }

    try {
      return ` ${JSON.stringify(data)}`;
    } catch {
      return ` ${String(data)}`;
    }
  }

  debug(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}${this.formatData(data)}`);
    }
  }

  info(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}${this.formatData(data)}`);
    }
  }

  warn(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}${this.formatData(data)}`);
    }
  }

  error(message: string, error?: unknown, data?: unknown) {
    if (this.level <= LOG_LEVELS.error) {
      const meta = data ? this.formatData(data) : '';

      if (error instanceof Error) {
        console.error(`[ERROR] ${message}${meta}`);
        console.error(error.stack || error.message);
      } else if (error && typeof error === 'object') {
        console.error(`[ERROR] ${message}${meta} ${JSON.stringify(error)}`);
      } else {
        console.error(`[ERROR] ${message}${meta}${error ? ` ${String(error)}` : ''}`);
      }
    }
  }
}

export const logger = new Logger();
