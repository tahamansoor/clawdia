export interface Env {
    configure(options?: {
        errorOnNotFound?: boolean;
        autoReload?: boolean;
        autoReloadRetryCount?: number;
        filePath?: string;
    }): void;
    load(): void
    get(key: string, def?: string): string;
}