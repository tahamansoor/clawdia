import { COLORS } from "../constants";
import { LogLevel } from "../types";

type LogMessage = string | number | boolean | object | Error | null | undefined;
type LogContext = string | Record<string, any>;

/**
 * Logger class for structured and color-coded console logging.
 */
export class Logger {
  /**
   * Serializes a message to a string format suitable for logging.
   * @param {LogMessage} message - The message to serialize.
   * @returns {string} Serialized message.
   */
  private static serializeMessage(message: LogMessage): string {
    if (message === null) return "null";
    if (message === undefined) return "undefined";
    if (typeof message === "string") return message;
    if (typeof message === "number" || typeof message === "boolean")
      return String(message);
    if (message instanceof Error) {
      return `${message.name}: ${message.message}${message.stack ? "\n" + message.stack : ""}`;
    }
    if (typeof message === "object") {
      try {
        return JSON.stringify(message, null, 2);
      } catch (error) {
        return "[Circular Object]";
      }
    }
    return String(message);
  }

  /**
   * Formats the context to be included in the log output.
   * @param {LogContext} [context] - The context to format.
   * @returns {string} Formatted context string.
   */
  private static formatContext(context?: LogContext): string {
    if (!context) return "";

    if (typeof context === "string") {
      return `${COLORS.CONTEXT}[${context}]${COLORS.RESET}`;
    }

    if (typeof context === "object") {
      const contextPairs = Object.entries(context)
        .map(([key, value]) => `${key}=${this.serializeMessage(value)}`)
        .join(" ");
      return `${COLORS.CONTEXT}[${contextPairs}]${COLORS.RESET}`;
    }

    return "";
  }

  /**
   * Formats a complete log message with level, timestamp, context, and content.
   * @param {LogLevel} level - Log level (e.g., INFO, ERROR).
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   * @returns {string} Formatted log string.
   */
  private static format(
    level: LogLevel,
    message: LogMessage,
    context?: LogContext,
  ): string {
    const timestamp = `${COLORS.TIMESTAMP}${new Date().toISOString()}${COLORS.RESET}`;
    const levelColor = COLORS[level] ?? COLORS.CONTEXT;
    const formattedLevel = `${levelColor}[${level}]${COLORS.RESET}`;
    const formattedContext = this.formatContext(context);
    const formattedMessage = this.serializeMessage(message);

    return `${timestamp} ${formattedLevel}${formattedContext ? " " + formattedContext : ""} ${formattedMessage}`;
  }

  /**
   * Logs an informational message.
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static info(message: LogMessage, context?: LogContext): void {
    console.log(this.format("INFO", message, context));
  }

  /**
   * Logs a warning message.
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static warn(message: LogMessage, context?: LogContext): void {
    console.warn(this.format("WARN", message, context));
  }

  /**
   * Logs an error message.
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static error(message: LogMessage, context?: LogContext): void {
    console.error(this.format("ERROR", message, context));
  }

  /**
   * Logs a debug message.
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static debug(message: LogMessage, context?: LogContext): void {
    console.debug(this.format("DEBUG", message, context));
  }

  /**
   * Logs a success message.
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static success(message: LogMessage, context?: LogContext): void {
    console.log(this.format("SUCCESS", message, context));
  }

  /**
   * Logs a trace message (with stack trace).
   * @param {LogMessage} message - The message to log.
   * @param {LogContext} [context] - Optional context.
   */
  static trace(message: LogMessage, context?: LogContext): void {
    console.trace(this.format("TRACE", message, context));
  }
}
