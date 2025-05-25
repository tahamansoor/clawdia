import { ROUTER_CONFIG_KEY } from "../constants";

export function RouterConfig<T>(config: { model: T; route?: string }) {
  return function (target: any) {
    Reflect.defineMetadata(ROUTER_CONFIG_KEY, config, target);
  };
}
