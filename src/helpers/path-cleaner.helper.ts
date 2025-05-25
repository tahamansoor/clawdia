export function cleanPath(str: string) {
  return str.replace(/^\/+|\/+$/g, "");
}
