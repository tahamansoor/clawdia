import "reflect-metadata";

/**
 * Gets metadata from an object using Reflect API
 * Traverses the entire prototype chain to find metadata
 *
 * @param obj - Object or constructor to retrieve metadata from
 * @param key - Metadata key (Symbol)
 * @returns The metadata or undefined if not found
 */
export function getMetaData<T = any>(obj: object, key: Symbol): T {
  return Reflect.getMetadata(key, obj) as T;
}
