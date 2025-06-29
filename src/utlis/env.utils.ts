import { readFileSync } from "fs"
import { Logger } from "../logger";
import { Env } from "../interfaces";

/**
 * Utility for managing environment variables loaded from a file.
 *
 * Provides methods to configure, load, and retrieve environment variables with support for auto-reloading and error handling.
 *
 * @remarks
 * - Use {@link configure} to set options before loading.
 * - Use {@link load} to manually load environment variables from the configured file.
 * - Use {@link get} to retrieve environment variables with optional default values and auto-reload support.
 *
 * @example
 * ```typescript
 * env.configure({ filePath: '.env.local', autoReload: true });
 * const dbHost = env.get('DB_HOST', 'localhost');
 * ```
 *
 * @jsdoc
 * @excludePrivate
 */
export const env: Env = new class implements Env {
    private _errorOnNotFound = false;
    private _isLoaded = false;
    private _autoReload = false;
    private _filePath = '.env';
    private _autoReloadRetryCount =  2;
    private _envObject: Record<string, string> =  {};

    /**
     * Configures the environment variable loader with options.
     *
     * @param options - Configuration options for the environment variable loader.
     * @param options.errorOnNotFound - Whether to throw an error if a variable is not found.
     * @param options.autoReload - Whether to automatically reload variables if not found.
     * @param options.autoReloadRetryCount - Number of retries for auto-reloading.
     * @param options.filePath - Path to the environment file to load variables from.
     */
    configure(options: {
        errorOnNotFound?: boolean,
        autoReload?: boolean,
        autoReloadRetryCount?: number,
        filePath?: string
    } = {}) {
        if (options.errorOnNotFound !== undefined) {
            this._errorOnNotFound = options.errorOnNotFound;
        }
        if (options.autoReload !== undefined) {
            this._autoReload = options.autoReload;
        }
        if (options.filePath !== undefined) {
            this._filePath = options.filePath;
        }
        if (options.autoReloadRetryCount !== undefined) {
            this._autoReloadRetryCount = options.autoReloadRetryCount;
        }
    };
    /**
     * Loads environment variables from the configured file.
     *
     * @throws Will throw an error if the file cannot be read or parsed.
     */
    load() {
        const filePath = this._filePath;
        try {
            const envContent = readFileSync(filePath, 'utf-8');
            const envObject: Record<string, string> = {};
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    envObject[key.trim()] = value.trim();
                }
            });
            this._envObject = envObject;
        } catch (error) {
            throw new Error(`Failed to load environment variables from ${filePath}: ${(error as Error).message}`);
        }
    };

    /**
     * Retrieves the value of an environment variable by key.
     *
     * @param key - The key of the environment variable to retrieve.
     * @param def - Optional default value to return if the variable is not found.
     * @returns The value of the environment variable or the default value if not found.
     */
    get(key: string, def?: string): string {
        if (!this._isLoaded) {
            this.load();
            this._isLoaded = true;
        }
        const value = this._envObject[key] ?? def;
        if (value === undefined) {
            if (this._autoReload) {
                Logger.warn(`Environment variable ${key} not found, retrying...`);
                this.load();
                this._autoReloadRetryCount--;
                if (this._autoReloadRetryCount > 0) {
                    return this.get(key, def);
                } else if (this._errorOnNotFound) {
                    Logger.error(`Failed to find environment variable ${key} after retries.`);
                }
            }
        }
        return value;
    }

};