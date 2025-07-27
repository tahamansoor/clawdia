import { Middleware } from "./middleware.type";

export type RouteHandler = {
  fn: Function;
  middlewares?: Middleware[];
};
