import { IMiddleware } from "../interfaces";

export type Middleware<T extends IMiddleware = IMiddleware> = new () => T;
