import { RouteDefinition } from "../interfaces";
import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "../enums";

export function Delete(path: string) {
  return function (context: object, target: any) {
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTES_KEY, context) || [];

    routes.push({ method: HttpMethods.DELETE, path, handlerName: target });
    Reflect.defineMetadata(ROUTES_KEY, routes, context);
  };
}
