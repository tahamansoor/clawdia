import { RouteHandler } from "../types";
import { RouteNode } from "./route-node";

export class RouteMapper {
  methods: Record<string, RouteNode> = {};

  add(method: string, path: string, handler: RouteHandler) {
    const parts = path.split("/").filter(Boolean);
    if (!this.methods[method]) this.methods[method] = new RouteNode("");
    this.methods[method].addRoute(parts, handler);
  }

  find(method: string, path: string) {
    const parts = path.split("/").filter(Boolean);
    return this.methods[method]?.match(parts) ?? null;
  }
}
