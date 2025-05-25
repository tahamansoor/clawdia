import { COLORS } from "../constants";
import { LogLevel } from "types";

export class Logger {
  private static format(level: LogLevel, message: string, context?: string) {
    const timestamp = `${COLORS.TIMESTAMP}${new Date().toISOString()}${COLORS.RESET}`;
    const levelColor = COLORS[level] ?? COLORS.CONTEXT;
    const ctx = context ? `${COLORS.CONTEXT}[${context}]${COLORS.RESET}` : "";
    return `${timestamp} ${levelColor}[${level}]${COLORS.RESET} ${ctx} ${message}`;
  }

  static info(message: string, context?: string) {
    console.log(this.format("INFO", message, context));
  }

  static warn(message: string, context?: string) {
    console.warn(this.format("WARN", message, context));
  }

  static error(message: string, context?: string) {
    console.error(this.format("ERROR", message, context));
  }

  static debug(message: string, context?: string) {
    console.debug(this.format("DEBUG", message, context));
  }
}
