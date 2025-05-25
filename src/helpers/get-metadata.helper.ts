import "reflect-metadata";
export function getMetaData(obj: object, key: Symbol) {
  return Reflect.getMetadata(key, obj);
}
