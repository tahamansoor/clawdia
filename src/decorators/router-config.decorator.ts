import { RouterConfigOptions } from "../interfaces";
import { ROUTER_CONFIG_KEY } from "../constants";
import "reflect-metadata";
import { BaseModel } from "../orm";

export function RouterConfig<T extends typeof BaseModel>(
  options: RouterConfigOptions<T>,
) {
  return function (target: Function) {
    Reflect.defineMetadata(ROUTER_CONFIG_KEY, options, target);
  };
}
