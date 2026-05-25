import pino from "pino";

export function createLogger() {
  return pino({
    transport: {
      target: "pino/file",
      options: { destination: 1 },
    },
    level: process.env.LOG_LEVEL ?? "info",
  });
}

export type Logger = ReturnType<typeof createLogger>;
