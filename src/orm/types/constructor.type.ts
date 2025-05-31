import { BaseModel } from "../model";

type ConcreteModelConstructor<T> = (new () => T) & typeof BaseModel;
type AbstractModelConstructor<T> = (abstract new () => T) & typeof BaseModel;
export type AnyModelConstructor<T> =
  | ConcreteModelConstructor<T>
  | AbstractModelConstructor<T>;
