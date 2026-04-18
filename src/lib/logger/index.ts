const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

const consoleFns: Record<LogLevel, (...args: unknown[]) => void> = {
  trace: console.debug,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

async function tauriLog(level: LogLevel, message: string): Promise<void> {
  const mod = await import("@tauri-apps/plugin-log")
  await mod[level](message)
}

function log(level: LogLevel, message: string): void {
  if (isTauri) {
    tauriLog(level, message).catch(() => consoleFns[level](message))
  } else {
    consoleFns[level](message)
  }
}

export const logger = {
  trace: (msg: string) => log("trace", msg),
  debug: (msg: string) => log("debug", msg),
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),
}
