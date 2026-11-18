interface StructuredError {
  origin: string;
  name: string;
  code?: string;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  raw: unknown;
}

let globalLoggingInstalled = false;

export function extractErrorDetails(
  origin: string,
  err: unknown,
  context?: Record<string, unknown>,
): StructuredError {
  if (err && typeof err === 'object') {
    const e = err as { name?: unknown; code?: unknown; message?: unknown; stack?: unknown };
    return {
      origin,
      name: typeof e.name === 'string' ? e.name : 'Error',
      code: typeof e.code === 'string' || typeof e.code === 'number' ? String(e.code) : undefined,
      message: typeof e.message === 'string' ? e.message : String(err),
      context,
      stack: typeof e.stack === 'string' ? e.stack : undefined,
      raw: err,
    };
  }
  return {
    origin,
    name: typeof err,
    message: String(err),
    context,
    raw: err,
  };
}

export function logInfo(scope: string, message: string, details?: unknown): void {
  if (details !== undefined) {
    console.info(`[CAMBLU:${scope}] ${message}`, details);
  } else {
    console.info(`[CAMBLU:${scope}] ${message}`);
  }
}

export function logWarn(scope: string, message: string, details?: unknown): void {
  if (details !== undefined) {
    console.warn(`[CAMBLU:${scope}] ${message}`, details);
  } else {
    console.warn(`[CAMBLU:${scope}] ${message}`);
  }
}

export function logError(
  scope: string,
  origin: string,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  const info = extractErrorDetails(origin, err, context);
  console.error(`[CAMBLU:${scope}] Erro em "${origin}": ${info.message}`, info);
}

/**
 * Installs window-level listeners once so unhandled runtime errors and rejected promises
 * always expose file/line/stack origin in DevTools Console.
 */
export function installGlobalErrorLogging(): void {
  if (typeof window === 'undefined' || globalLoggingInstalled) return;
  globalLoggingInstalled = true;

  window.addEventListener('error', (event) => {
    const source = event.filename
      ? `${event.filename}:${event.lineno}:${event.colno}`
      : 'window.onerror';
    logError('Global', source, event.error ?? event.message, {
      type: 'error',
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError('Global', 'window.unhandledrejection', event.reason, {
      type: 'unhandledrejection',
    });
  });
}
