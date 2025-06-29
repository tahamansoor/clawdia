import { RequestContext } from "./request-context.interface";
import { ResponseContext } from "./response-context.interface";
import { NextFunction } from "../types";
export interface IMiddleware {
  apply(
    req: RequestContext,
    res: ResponseContext,
    next: NextFunction,
  ): Promise<void> | void;
}
