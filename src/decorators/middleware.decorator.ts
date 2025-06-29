import { MIDDLEWARE_KEY } from "../constants";
import { IMiddleware } from "../interfaces";

// Overloads for typing
export function UseMiddleware<T extends IMiddleware>(
  ...middlewareClasses: Array<new () => T>
): ClassDecorator;
export function UseMiddleware<T extends IMiddleware>(
  ...middlewareClasses: Array<new () => T>
): MethodDecorator;

// Actual implementation
export function UseMiddleware<T extends IMiddleware>(
  ...middlewareClasses: Array<new () => T>
): MethodDecorator | ClassDecorator {
  return function (
    target: Object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ) {
    if (propertyKey) {
      // Per-method decorator
      const existing =
        Reflect.getMetadata(MIDDLEWARE_KEY, target, propertyKey) || [];
      Reflect.defineMetadata(
        MIDDLEWARE_KEY,
        [...existing, ...middlewareClasses],
        target,
        propertyKey
      );
    } else {
      // Per-class decorator
      const existing = Reflect.getMetadata(MIDDLEWARE_KEY, target) || [];
      Reflect.defineMetadata(
        MIDDLEWARE_KEY,
        [...existing, ...middlewareClasses],
        target
      );
    }
  };
}
