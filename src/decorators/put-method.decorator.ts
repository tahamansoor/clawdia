import { RouteDefinition } from "../interfaces";
import { ROUTES_KEY } from "../constants";
import "reflect-metadata";
import { HttpMethods } from "../enums";

export function Put(path: string) {
  return function (target: any, propertyKey: string) {
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
    routes.push({ method: HttpMethods.PUT, path, handlerName: propertyKey });
    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
  };
}
