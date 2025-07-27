import { RouteHandler } from "../types";

export class RouteNode {
  segment: string;
  children: Map<string, RouteNode> = new Map();
  paramChild?: RouteNode;
  handler?: RouteHandler;

  constructor(segment: string) {
    this.segment = segment;
  }

  addRoute(parts: string[], handler: RouteHandler) {
    if (parts.length === 0) {
      this.handler = handler;
      return;
    }

    const [head, ...rest] = parts;
    let next: RouteNode;

    if (head.startsWith(":")) {
      if (!this.paramChild) this.paramChild = new RouteNode(head);
      next = this.paramChild;
    } else {
      if (!this.children.has(head))
        this.children.set(head, new RouteNode(head));
      next = this.children.get(head)!;
    }

    next.addRoute(rest, handler);
  }

  match(
    parts: string[],
    params: Record<string, string> = {},
  ): { handler: RouteHandler; params: Record<string, string> } | null {
    if (parts.length === 0)
      return this.handler ? { handler: this.handler, params } : null;

    const [head, ...rest] = parts;

    // static match
    if (this.children.has(head)) {
      const result = this.children.get(head)!.match(rest, params);
      if (result) return result;
    }

    // dynamic match
    if (this.paramChild) {
      const paramName = this.paramChild.segment.slice(1);
      const newParams = { ...params, [paramName]: head };
      const result = this.paramChild.match(rest, newParams);
      if (result) return result;
    }

    return null;
  }
}
