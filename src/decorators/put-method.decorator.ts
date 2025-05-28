import { RouteDefinition } from "../interfaces";
import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "../enums";

export function Put(path: string) {
  return function (context: object, target: any) {
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTES_KEY, context) || [];

    routes.push({ method: HttpMethods.POST, path, handlerName: target });
    Reflect.defineMetadata(ROUTES_KEY, routes, context);
  };
}
