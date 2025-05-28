import { PoolOptions } from "pg";
import { Middleware } from "./middleware.interface";
import { Router } from "../router";
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
