import { RouteDefinition } from "../interfaces";
import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "../enums";

/**
 * Decorator for GET HTTP method routes
 *
 * @param path - The route path
 */
export function Put(path: string): MethodDecorator {
  return function<T> (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    // Ensure the method descriptor exists
    if (!descriptor || typeof descriptor.value !== "function") {
      return descriptor;
    }

    // Get existing routes or initialize empty array
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTES_KEY, descriptor.value) || [];

    // Add this route to the array
    routes.push({
      method: HttpMethods.PUT,
      path: path || "/",
      handlerName: propertyKey.toString(),
    });

    // Store metadata on the method itself
    Reflect.defineMetadata(ROUTES_KEY, routes, descriptor.value);

    // Also store on the prototype method for class-based lookup
    if (target && target.constructor && target.constructor.prototype) {
      Reflect.defineMetadata(
        ROUTES_KEY,
        routes,
        target.constructor.prototype[propertyKey],
      );
    }

    return descriptor;
  };
}
