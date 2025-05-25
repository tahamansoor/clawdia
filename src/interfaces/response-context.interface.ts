import { ServerResponse } from "node:http";

export interface ResponseContext {
  return: (status: number, body: any) => void;
  raw: ServerResponse;
}
