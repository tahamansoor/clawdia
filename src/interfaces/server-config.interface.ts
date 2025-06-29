import { PoolOptions } from "pg";
import { Router } from "../router";
import { Middleware } from "../types";
import { BaseModel } from "../orm";
export interface ServerConfig {
  port?: number;
  globalMiddleware?: Middleware[];
  routers?: (new () => Router<typeof BaseModel>)[];
  db?: {
    connectionURI: string;
    options?: Partial<PoolOptions>;
  };
}
