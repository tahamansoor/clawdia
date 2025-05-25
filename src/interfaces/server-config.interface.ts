import { PoolOptions } from "pg";
import { Middleware } from "./middleware.interface";
import { Router } from "router";
export interface ServerConfig {
  port?: number;
  globalMiddleware?: Middleware[];
  routers?: (typeof Router)[];
  db?: {
    connectionURI: string;
    options?: PoolOptions;
  };
}
