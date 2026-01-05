type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${dataStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data: sanitizeData(data),
  };
}

function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, data);
      console.debug(formatLog(entry));
    }
  },

  info(message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('info', message, data);
    console.info(formatLog(entry));
  },

  warn(message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('warn', message, data);
    console.warn(formatLog(entry));
  },

  error(message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('error', message, data);
    console.error(formatLog(entry));
  },

  // Structured log for specific events
  submission(action: 'created' | 'updated' | 'deleted', id: string, data?: Record<string, unknown>) {
    this.info(`Submission ${action}`, { submissionId: id, ...data });
  },

  sheetSync(status: 'success' | 'failed' | 'retry', id: string, data?: Record<string, unknown>) {
    const level = status === 'failed' ? 'error' : 'info';
    this[level](`Sheet sync ${status}`, { submissionId: id, ...data });
  },

  auth(action: 'login' | 'logout' | 'failed', data?: Record<string, unknown>) {
    const level = action === 'failed' ? 'warn' : 'info';
    this[level](`Auth ${action}`, data);
  },
};
