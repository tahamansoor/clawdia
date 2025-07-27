import { RouteHandler } from "../types";
import { RouteNode } from "./route-node";

export class RouteMapper {
  methods: Record<string, RouteNode> = {};

  add(method: string, path: string, handler: RouteHandler) {
    const normalizedMethod = method.toUpperCase();
    const parts = path.split("/").filter(Boolean);
    if (!this.methods[normalizedMethod])
      this.methods[normalizedMethod] = new RouteNode("");
    this.methods[normalizedMethod].addRoute(parts, handler);
  }

  find(method: string, path: string) {
    const normalizedMethod = method.toUpperCase();
    const parts = path.split("/").filter(Boolean);
    return this.methods[normalizedMethod]?.match(parts) ?? null;
  }
}
