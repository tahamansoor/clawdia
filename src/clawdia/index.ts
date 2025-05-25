import { ROUTES_KEY } from "../constants";
import { HttpMethods } from "enums";
import { cleanPath, getMetaData, showBanner } from "helpers";
import {
  Middleware,
  RequestContext,
  ResponseContext,
  RouteDefinition,
  ServerConfig,
} from "interfaces";
import { Logger } from "logger";
import { IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { Model } from "orm";
import { Pool } from "pg";
import { Router } from "router";

export class Clawdia {
  private logger = Logger;
  port: number;
  globalMiddleware?: Middleware[];
  routers?: Router<any>[] = [];
  connectionURI?: string;
  db?: Pool;
  private readonly routeMap: Map<string, Function> = new Map();
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
      Model.useDB(this.db);
    }

    showBanner();
  }

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
          resCtx.return(404, { message: "not found" });
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
      this.logger.error("Error starting server:", JSON.stringify(error));
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
    for (const router of this.routers ?? []) {
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
