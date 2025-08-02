import { RequestContext, ResponseContext } from "../interfaces";

export type RouteHandlerFunction = (
  req: RequestContext,
  res: ResponseContext,
) => Promise<void> | void;
