export type LogLevel = "info" | "warn" | "error" | "debug";

export function log(level: LogLevel, message: string, meta?: Record<string, any>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  };

  const output = JSON.stringify(payload);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, any>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, any>) => log("error", msg, meta),
  debug: (msg: string, meta?: Record<string, any>) => log("debug", msg, meta),
};
