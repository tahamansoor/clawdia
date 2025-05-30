import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "../enums";
import { cleanPath, getMetaData, showBanner } from "../helpers";
import {
  Middleware,
  RequestContext,
  ResponseContext,
  RouteDefinition,
  ServerConfig,
} from "../interfaces";
import { Logger } from "../logger";
import { IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { BaseModel } from "../orm";
import { Pool } from "pg";
import { Router } from "../router";

/**
 * Clawdia - A lightweight, fast Node.js backend framework
 *
 * Clawdia provides a streamlined approach to building REST APIs with TypeScript,
 * featuring automatic route registration, middleware support, and PostgreSQL integration.
 *
 * Core features:
 * - Decorator-based route registration
 * - Middleware pipeline for request processing
 * - PostgreSQL database integration
 * - Model-based ORM with automatic CRUD operations
 * - Type-safe request and response handling
 *
 * @example
 * ```typescript
 * // Basic server setup
 * const server = new Clawdia({
 *   port: 3000,
 *   routers: [UserRouter, ProductRouter],
 *   globalMiddleware: [AuthMiddleware, LoggerMiddleware],
 *   db: {
 *     connectionURI: "postgresql://user:password@localhost:5432/mydb"
 *   }
 * });
 *
 * server.listen();
 * ```
 */
export class Clawdia {
  /**
   * Logger instance for framework-level logging
   * @private
   */
  private logger = Logger;

  /**
   * The port number the server will listen on
   */
  port: number;

  /**
   * Global middleware applied to all routes
   * These are executed in order before route handlers
   */
  globalMiddleware?: Middleware[];

  /**
   * Array of router instances registered with the application
   * Each router contains route handlers for a specific resource
   */
  routers?: Router<typeof BaseModel>[] = [];

  /**
   * Database connection string for PostgreSQL
   */
  connectionURI?: string;

  /**
   * PostgreSQL connection pool instance
   */
  db?: Pool;

  /**
   * Internal mapping of route patterns to handler functions
   * Format: `${HttpMethod}:${path}` -> handlerFunction
   * @private
   */
  private readonly routeMap: Map<string, Function> = new Map();

  /**
   * Creates a new Clawdia server instance
   *
   * @param {ServerConfig} config - Server configuration options
   * @param {number} [config.port=3003] - Port number to listen on
   * @param {Middleware[]} [config.globalMiddleware] - Array of global middleware
   * @param {(new () => Router<typeof BaseModel>)[]} [config.routers] - Router classes to register
   * @param {Object} [config.db] - Database configuration
   * @param {string} [config.db.connectionURI] - PostgreSQL connection string
   * @param {Object} [config.db.options] - Additional pg.Pool options
   *
   * @example
   * ```typescript
   * const server = new Clawdia({
   *   port: 8080,
   *   routers: [UserRouter],
   *   db: {
   *     connectionURI: process.env.DATABASE_URL
   *   }
   * });
   * ```
   */
  constructor(config: ServerConfig) {
    this.port = config.port ?? 3003;
    this.globalMiddleware = config.globalMiddleware;
    this.routers = config?.routers?.map((routerClass) => new routerClass());
    this.connectionURI = config?.db?.connectionURI;
    if (this.connectionURI) {
      this.db = new Pool({
        connectionString: this.connectionURI,
        ...config?.db?.options,
      });
      BaseModel.useDB(this.db);
    }

    showBanner();
  }

  /**
   * Starts the HTTP server and initializes all components
   *
   *
   * @returns {Promise<void>} A promise that resolves when the server starts
   *
   * @throws {Error} If database connection fails
   * @throws {Error} If route mapping fails
   * @throws {Error} If server initialization fails
   *
   * @example
   * ```typescript
   * import { logger } from 'clawdia';
   * const server = new Clawdia({...});
   *
   * // Start the server
   * server.listen()
   *   .then(() => logger.log('Server is running'))
   *   .catch(err => logger.error('Failed to start server:', err));
   * ```
   */
  async listen() {
    try {
      if (this.db) {
        await this.db.query("SELECT 1").catch((error) => {
          throw error;
        });
        this.logger.info("Clawdia connected to the database");
      }
      this.createRouteMap();
      const server = createServer(async (req, res) => {
        const reqCtx: RequestContext = {
          headers: req.headers as Record<string, string>,
          body: await this.parseBody(req),
          raw: req,
        };
        const resCtx: ResponseContext = {
          raw: res,
          return: (status: number, body: any) => {
            res.statusCode = status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(body));
          },
        };

        const method = this.findMethod(req.method ?? "GET", req.url ?? "/");

        if (!method) {
          resCtx.return(404, {
            message: "not found",
            availableRoutes: Array.from(this.routeMap.entries()).map(
              ([path, methods]) => ({ path, methods }),
            ),
          });
          return;
        }
        await this.runMiddleware(this.globalMiddleware ?? [], reqCtx, resCtx);
        try {
          await method(reqCtx, resCtx);
        } catch (err) {
          this.logger.error("Error handling request:", JSON.stringify(err));
          resCtx.return(500, { message: "Internal Server Error" });
        }
      });

      server.listen(this.port, () => {
        this.logger.info(`Clawdia is purring at http://localhost:${this.port}`);
      });
    } catch (error) {
      console.error(error);
      this.logger.error("Error starting server:", error as any);
      throw error;
    }
  }

  /**
   * Parses the request body from an IncomingMessage
   *
   * Reads the request body stream and attempts to parse it as JSON.
   * If parsing fails, returns an empty object.
   *
   * @param {IncomingMessage} req - The HTTP request object
   * @returns {Promise<any>} The parsed request body or an empty object
   * @private
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({});
        }
      });
    });
  }
  /**
   * Builds the internal route map from registered routers
   *
   * This method:
   * 1. Iterates through all registered routers
   * 2. Extracts methods with route metadata
   * 3. Maps HTTP method + path patterns to handler functions
   *
   * @private
   * @throws {Error} If route metadata is missing or invalid
   */
  private createRouteMap() {
    for (const router of this.routers ?? []) {
      const methodNames = this.getAllMethodNames(router);

      for (const methodName of methodNames) {
        const method = (router as any)[methodName];

        const routeMetaData: RouteDefinition[] = getMetaData(
          method,
          ROUTES_KEY,
        );
        const fullPath = cleanPath(
          `${cleanPath(router.routeName)}/${cleanPath(routeMetaData[0].path)}`,
        );
        const key = `${routeMetaData[0].method}:${fullPath}`;
        this.routeMap.set(key, method.bind(router));
      }
    }
  }

  /**
   * Retrieves all method names from an object including inherited ones
   *
   * Traverses the prototype chain to find all methods, excluding
   * special properties like 'constructor', 'model', etc.
   *
   * @param {any} obj - The object to extract method names from
   * @returns {string[]} Array of method names
   * @private
   */
  private getAllMethodNames(obj: any): string[] {
    const methodNames: string[] = [];
    let currentObj = obj;

    while (currentObj && currentObj !== Object.prototype) {
      const properties = Object.getOwnPropertyNames(currentObj);

      for (const prop of properties) {
        // Exclude 'constructor', 'model', 'path', 'logger'
        if (
          prop !== "constructor" &&
          prop !== "model" &&
          prop !== "path" &&
          prop !== "logger" &&
          typeof currentObj[prop] === "function"
        ) {
          methodNames.push(prop);
        }
      }
      currentObj = Object.getPrototypeOf(currentObj);
    }

    return Array.from(new Set(methodNames));
  }

  /**
   * Finds the appropriate route handler for the given HTTP method and URL
   *
   * Uses the internal route map to look up the handler function that
   * matches the request's HTTP method and path.
   *
   * @param {string} httpMethod - The HTTP method (GET, POST, etc.)
   * @param {string} url - The request URL path
   * @returns {Function|undefined} The matching handler function or undefined if not found
   * @private
   */
  private findMethod(httpMethod: string, url: string) {
    return this.routeMap.get(
      `${Object.values(HttpMethods).find((method) => method === httpMethod)! as string}:${cleanPath(url)}`,
    );
  }
  /**
   * Executes a series of middleware functions in sequence
   *
   * Processes each middleware in the array, passing the request and response
   * contexts. If a middleware doesn't call next(), the chain stops.
   *
   * @param {Middleware[]} middlewares - Array of middleware to execute
   * @param {RequestContext} reqCtx - The request context
   * @param {ResponseContext} resCtx - The response context
   * @returns {Promise<void>} A promise that resolves when all middleware complete
   * @private
   */
  private async runMiddleware(
    middlewares: Middleware[],
    reqCtx: RequestContext,
    resCtx: ResponseContext,
  ) {
    for (const middleware of middlewares) {
      await middleware.apply(reqCtx, resCtx, () => {
        return;
      });
    }
  }
}
