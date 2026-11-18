/**
 * Recursively removes `undefined` fields so Firestore `setDoc` writes never reject optional properties.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        clean[key] = stripUndefinedDeep(val);
      }
    }
    return clean as T;
  }
  return value;
}
