import { createServer, IncomingMessage } from "node:http";
import { cleanPath, getMetaData } from "./helpers";
import "reflect-metadata";
import {
  Middleware,
  ServerConfig,
  RequestContext,
  ResponseContext,
  IRouter,
  RouteDefinition,
  RouterConfig,
} from "./interfaces";
import { HttpMethods } from "./enums";
import { Pool } from "pg";
import { MODEL_KEY, ROUTER_CONFIG_KEY, ROUTES_KEY } from "./constants";

export class Clawdia {
  port: number;
  globalMiddleware?: Middleware[];
  routers: Router<any>[];
  connectionURI: string;
  db?: Pool;
  private readonly routeMap: Map<string, Function> = new Map();
  constructor(config: ServerConfig) {
    this.port = config.port ?? 3003;
    this.globalMiddleware = config.globalMiddleware;
    this.routers = config.routers.map((routerClass) => new routerClass());
    this.connectionURI = config.db.connectionURI;
    this.db = new Pool({
      connectionString: this.connectionURI,
      ...config.db.options,
    });
    Model.useDB(this.db);
  }

  async listen() {
    try {
      if (this.db) {
        await this.db.query("SELECT 1").catch((error) => {
          throw error;
        });
        console.log("🟢 Clawdia connected to the database");
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
          resCtx.return(404, { message: "not found" });
          return;
        }
        await this.runMiddleware(this.globalMiddleware ?? [], reqCtx, resCtx);
        try {
          await method(reqCtx, resCtx);
        } catch (err) {
          console.error("Error handling request:", err);
          resCtx.return(500, { message: "Internal Server Error" });
        }
      });

      server.listen(this.port, () => {
        console.log(`Clawdia is purring at http://localhost:${this.port}`);
      });
    } catch (error) {
      throw error;
    }
  }

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
  private createRouteMap() {
    for (const router of this.routers) {
      const methodNames = this.getAllMethodNames(router);
      for (const methodName of methodNames) {
        const method = (router as any)[methodName];
        const routeMetaData: RouteDefinition = getMetaData(method, ROUTES_KEY);
        const fullPath = `${cleanPath(router.routeName)}/${cleanPath(routeMetaData.path)}`;
        const key = `${routeMetaData.method}:${fullPath}`;
        this.routeMap.set(key, method.bind(router));
      }
    }
  }

  private getAllMethodNames(obj: any): string[] {
    const methodNames: string[] = [];
    let currentObj = obj;

    // Traverse the prototype chain until you reach Object.prototype
    while (currentObj && currentObj !== Object.prototype) {
      const properties = Object.getOwnPropertyNames(currentObj);

      for (const prop of properties) {
        // Exclude 'constructor' as it's not a regular method you'd typically want
        if (prop !== "constructor" && typeof currentObj[prop] === "function") {
          methodNames.push(prop);
        }
      }
      currentObj = Object.getPrototypeOf(currentObj);
    }

    // Use a Set to ensure uniqueness, then convert back to an array
    return Array.from(new Set(methodNames));
  }

  private findMethod(httpMethod: string, url: string) {
    return this.routeMap.get(
      `${Object.values(HttpMethods).find((method) => method === httpMethod)! as string}:${cleanPath(url)}`,
    );
  }
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

export class Router<T extends Model> implements IRouter<T> {
  routeName: string;
  model: T;
  private config: RouterConfig<T>;
  constructor() {
    this.config = getMetaData(this.constructor, ROUTER_CONFIG_KEY);
    this.routeName =
      "/" + (this.config.route ?? this.constructor.name.toLowerCase());
    this.model = this.config.model;
  }
}

export abstract class Model {
  static db: Pool;

  static useDB(pool: Pool) {
    this.db = pool;
  }

  static getTableName(): string {
    const config = getMetaData(this, MODEL_KEY);
    return config?.name ?? this.name.toLowerCase() + "s";
  }

  static async findAll<T>(this: { new (): T } & typeof Model): Promise<T[]> {
    const table = this.getTableName();
    const result = await this.db.query(`SELECT * FROM ${table}`);
    return result.rows as T[];
  }

  static async findOne<T>(
    this: { new (): T } & typeof Model,
    where: Partial<T>,
  ): Promise<T | null> {
    const table = this.getTableName();
    const keys = Object.keys(where);
    const values = Object.values(where);
    const whereClause = keys
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ");
    const result = await this.db.query(
      `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
      values,
    );
    return result.rows[0] ?? null;
  }

  static async create<T>(
    this: { new (): T } & typeof Model,
    data: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
      INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;
    const result = await this.db.query(query, values);
    return result.rows[0] as T;
  }

  static async update<T extends Record<string, any>>(
    id: string,
    changes: Partial<T>,
  ): Promise<T> {
    const table = this.getTableName();
    const keys = Object.keys(changes);
    const values = Object.values(changes);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const query = `
        UPDATE ${table}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *;
      `;

    const result = await this.db.query(query, [...values, id]);
    return result.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ${this.getTableName()} WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
