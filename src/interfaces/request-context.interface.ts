import { IncomingMessage } from "node:http";
export interface RequestContext {
  headers: Record<string, string>;
  body: any;
  raw: IncomingMessage;
}
