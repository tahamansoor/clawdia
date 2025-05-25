import { RouteDefinition } from "../interfaces";
import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "../enums";
import "reflect-metadata";

export function Get(path: string) {
  return function (target: any, propertyKey: string) {
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
    routes.push({ method: HttpMethods.GET, path, handlerName: propertyKey });
    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
  };
}
