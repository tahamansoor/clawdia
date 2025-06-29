import { RouterConfigOptions } from "../interfaces";
import { ROUTER_CONFIG_KEY } from "../constants";
import "reflect-metadata";
import { BaseModel } from "../orm";

/**
 * RouterConfig - Class decorator for configuring router behavior
 * 
 * This decorator associates a model class with a router and defines the base route path.
 * It stores these configurations as metadata on the router class for later retrieval
 * by the Router base class during initialization.
 * 
 * @template T - Type parameter extending BaseModel constructor. This ensures the model
 *               provided is a valid model class that extends BaseModel.
 * 
 * @param {RouterConfigOptions<T>} options - Configuration options for the router
 * @param {T} options.model - The model class that this router will operate on
 * @param {string} options.route - The base route path for this router (without leading slash)
 * 
 * @returns {ClassDecorator} A decorator function that can be applied to a router class
 * 
 * @example
 * Basic usage:
 * ```typescript
 * @RouterConfig({
 *   model: User,
 *   route: 'users'
 * })
 * export class UserRouter extends Router<typeof User> {
 *   // Route handlers...
 * }
 * ```
 * 
 * @example
 * With nested routes:
 * ```typescript
 * @RouterConfig({
 *   model: Product,
 *   route: 'shop/products'
 * })
 * export class ProductRouter extends Router<typeof Product> {
 *   // Route handlers...
 * }
 * ```
 * 
 * @example
 * With route parameter in base path:
 * ```typescript
 * @RouterConfig({
 *   model: Order,
 *   route: 'users/:userId/orders'
 * })
 * export class OrderRouter extends Router<typeof Order> {
 *   // Route handlers...
 * }
 * ```
 * 
 * @remarks
 * - The model specified must extend BaseModel to provide database operations
 * - The route should not include a leading slash (/) as it will be added automatically
 * - This decorator's metadata is read by the Router base class constructor
 * - If the route is omitted, the router's lowercase class name will be used
 * 
 * @throws Will not throw errors during decoration, but the Router initialization
 * will fail if invalid options are provided.
 */
export function RouterConfig<T extends typeof BaseModel>(
  options: RouterConfigOptions<T>,
): ClassDecorator {
  /**
   * The decorator function that applies configuration to a router class
   * 
   * @param {T} target - The router class being decorated
   * @returns {T} The decorated router class
   * @internal
   */
  return function <T extends Object>(target: T) {
    // Store the router configuration as metadata on the target class
    // This will be retrieved by the Router base class during initialization
    Reflect.defineMetadata(ROUTER_CONFIG_KEY, options, target);
    
    return target;
  };
}
