// filename: src/utils/logger.ts
// --- Structured Logger for Night Block ---
// Changes:
//   1. Log levels (debug, info, warn, error)
//   2. Timestamp + context prefix

export const logger = {
  debug: (msg: string) => console.debug(`[DEBUG] ${new Date().toISOString()} ${msg}`),
  info: (msg: string) => console.info(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};