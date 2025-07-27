import { Middleware } from "./middleware.type";
import { RouteHandlerFunction } from "./param-handler-function.type";

export type RouteHandler = {
  fn: RouteHandlerFunction;
  middlewares?: Middleware[];
};
