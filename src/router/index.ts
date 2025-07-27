import { ROUTER_CONFIG_KEY } from "../constants";
import { Delete, Get, Post, Put } from "../decorators";
import { getMetaData } from "../helpers";
import {
  IRouter,
  RequestContext,
  ResponseContext,
  RouterConfigOptions,
} from "../interfaces";
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
 * -@RouterConfig({
 *   model: User,
 *   route: "users"
 * })
 * class UserRouter extends Router<typeof User> {
 *   -@Get("/")
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

  /**
   *
   *
   * @param req
   * @param res
   */
  @Get("/")
  protected async findAll(
    req: RequestContext,
    res: ResponseContext,
  ): Promise<void> {
    try {
      const records = await this.model.findAll();
      res.return(200, records);
    } catch (error) {
      this.logger.error(`Error finding all ${this.model.name}:`, error as any);
      res.return(500, { message: "Internal server error" });
    }
  }

  /**
   *
   *
   * @param req
   * @param res
   */
  @Get("/:id")
  protected async findById(
    req: RequestContext,
    res: ResponseContext,
  ): Promise<void> {
    try {
      this.logger.debug(req.params);
      if (!req.params?.id) {
        res.return(400, { message: "Missing ID parameter" });
        return;
      }
      const id = Number(req.params.id);
      this.logger.info(`Finding ${this.model.name} by ID: ${id}`);
      const record = await this.model.findOne({ where: { id } });
      if (!record) {
        res.return(404, { message: "Record not found" });
      } else {
        res.return(200, record);
      }
    } catch (error) {
      this.logger.error(
        `Error finding ${this.model.name} by ID:`,
        error as any,
      );
      res.return(500, { message: "Internal server error" });
      throw error;
    }
  }

  /**
   *
   *
   * @param req
   * @param res
   */
  @Post("/")
  protected async create(
    req: RequestContext,
    res: ResponseContext,
  ): Promise<void> {
    try {
      const data = req.body;
      const record = await this.model.create(data);
      res.return(201, record);
    } catch (error) {
      this.logger.error(`Error creating ${this.model.name}:`, error as any);
      res.return(500, { message: "Internal server error" });
    }
  }

  /**
   *
   *
   * @param req
   * @param res
   */
  @Put("/:id")
  protected async update(
    req: RequestContext,
    res: ResponseContext,
  ): Promise<void> {
    try {
      if (!req.params?.id) {
        res.return(400, { message: "Missing ID parameter" });
        return;
      }
      const id = req.params.id;
      const data = req.body;
      const record = await this.model.update(data, { where: { id } });
      if (!record) {
        res.return(404, { message: "Record not found" });
      } else {
        res.return(200, record);
      }
    } catch (error) {
      this.logger.error(
        `Error updating ${this.model.name} by ID:`,
        error as any,
      );
      res.return(500, { message: "Internal server error" });
    }
  }

  /**
   *
   *
   * @param req
   * @param res
   */
  @Delete("/:id")
  protected async delete(
    req: RequestContext,
    res: ResponseContext,
  ): Promise<void> {
    try {
      if (!req.params?.id) {
        res.return(400, { message: "Missing ID parameter" });
        return;
      }
      const id = req.params.id;
      const record = await this.model.delete({ where: { id } });
      if (!record) {
        res.return(404, { message: "Record not found" });
      } else {
        res.return(204, {});
      }
    } catch (error) {
      this.logger.error(
        `Error deleting ${this.model.name} by ID:`,
        error as any,
      );
      res.return(500, { message: "Internal server error" });
    }
  }
}
