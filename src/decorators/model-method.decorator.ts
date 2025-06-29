import "reflect-metadata";
import { MODEL_KEY } from "../constants";
export function Model(name: string): ClassDecorator {
  return function <T extends Object> (target: T) {
    return Reflect.defineMetadata(MODEL_KEY, { name }, target);
  };
}
