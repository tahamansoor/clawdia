import "reflect-metadata";
import { MODEL_KEY } from "../constants";
export function Model(name: string) {
  return function (target: object) {
    return Reflect.defineMetadata(MODEL_KEY, { name }, target);
  };
}
