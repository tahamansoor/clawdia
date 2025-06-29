import { HttpMethods } from "../enums";

export interface RouteDefinition {
  path: string;
  method: HttpMethods;
  handlerName: string | symbol;
}
