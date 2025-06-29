export type MethodDecorator<T = any> = (
  target: T,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => void;