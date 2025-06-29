import { IMiddleware } from "../interfaces";
import { RequestContext, ResponseContext } from "../interfaces";
import { Logger } from "../logger";

export class LoggerMiddleware implements IMiddleware {
  async apply(req: RequestContext, res: ResponseContext, next: () => Promise<void>) {
    Logger.info(`[${req.raw.method}] ${req.raw.url}`);
    await next();
  }
}