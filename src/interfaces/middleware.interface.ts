import { RequestContext } from "./request-context.interface";
import { ResponseContext } from "./response-context.interface";
import { NextFunction } from "../types";
export interface Middleware {
  apply(
    req: RequestContext,
    res: ResponseContext,
    next: NextFunction,
  ): Promise<void> | void;
}
