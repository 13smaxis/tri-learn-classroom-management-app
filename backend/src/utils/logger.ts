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

  private formatLog(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      message,
      ...(typeof data === 'object' && data !== null ? data : { details: data }),
    };

    return JSON.stringify(payload);
  }

  debug(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${this.formatLog(message, data)}`);
    }
  }

  info(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.info) {
      console.log(`[INFO] ${this.formatLog(message, data)}`);
    }
  }

  warn(message: string, data?: unknown) {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${this.formatLog(message, data)}`);
    }
  }

  error(message: string, error?: unknown, data?: unknown) {
    if (this.level <= LOG_LEVELS.error) {
      const meta = data ? { ...((typeof data === 'object' && data !== null) ? data : { details: data }) } : undefined;

      if (error instanceof Error) {
        console.error(`[ERROR] ${this.formatLog(message, meta)}`);
        console.error(error.stack || error.message);
      } else if (error && typeof error === 'object') {
        console.error(`[ERROR] ${this.formatLog(message, { ...meta, error })}`);
      } else {
        console.error(`[ERROR] ${this.formatLog(message, { ...meta, error: error ? String(error) : null })}`);
      }
    }
  }
}

export const logger = new Logger();
