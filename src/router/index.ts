import { ROUTER_CONFIG_KEY } from "../constants";
import { getMetaData } from "../helpers";
import { IRouter, RouterConfigOptions } from "../interfaces";
import { Logger } from "../logger";
import { BaseModel } from "../orm";

/**
 * Abstract Router class serving as the base for all API routers in the application.
 * 
 * The Router class provides the foundation for creating RESTful API endpoints
 * by handling route registration, model binding, and HTTP method handling.
 * 
 * @template TModel - The model type that extends BaseModel constructor. This generic
 *                    parameter ensures type safety when accessing the model property.
 * 
 * @example
 * ```typescript
 * @RouterConfig({
 *   model: User,
 *   route: "users"
 * })
 * class UserRouter extends Router<typeof User> {
 *   @Get("/")
 *   async getAllUsers(req: RequestContext, res: ResponseContext) {
 *     const users = await this.model.findAll();
 *     res.return(200, users);
 *   }
 * }
 * ```
 */
export abstract class Router<TModel extends typeof BaseModel>
  implements IRouter<TModel>
{
  /**
   * Logger instance for router-specific logging.
   * @private
   */
  private logger = Logger;

  /**
   * The base route path for this router.
   * This is derived from the RouterConfig decorator's route property
   * or falls back to the lowercase router class name.
   * @example "/users" or "/products"
   */
  routeName: string;

  /**
   * Configuration metadata retrieved from the RouterConfig decorator.
   * Contains essential information like the model and route.
   * @private
   */
  private config: RouterConfigOptions<TModel>;

  /**
   * Initializes a new router instance.
   * 
   * During initialization, the router:
   * 1. Retrieves its configuration metadata from the RouterConfig decorator
   * 2. Sets up the route name based on configuration
   * 3. Logs the initialization event
   * 
   * @throws {Error} If the RouterConfig metadata is missing or invalid
   */
  constructor() {
    this.config = getMetaData(this.constructor, ROUTER_CONFIG_KEY);

    this.routeName =
      "/" + (this.config.route ?? this.constructor.name.toLowerCase());
    this.logger.info(`INITIALIZED ${this.constructor.name}`);
  }

  /**
   * Gets the model class associated with this router.
   * 
   * The model is specified in the RouterConfig decorator and provides
   * access to database operations for the entity managed by this router.
   * 
   * @returns {TModel} The model class constructor
   * 
   * @example
   * ```typescript
   * // In a router method:
   * const users = await this.model.findAll();
   * ```
   */
  get model(): TModel {
    return this.config.model;
  }
}
