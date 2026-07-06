export function parseJsonFields<T extends Record<string, unknown>>(obj: T, fields: string[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      try {
        (result as Record<string, unknown>)[field] = JSON.parse(result[field] as string);
      } catch {
        (result as Record<string, unknown>)[field] = [];
      }
    }
  }
  return result;
}

export function parseJsonFieldsArray<T extends Record<string, unknown>>(items: T[], fields: string[]): T[] {
  return items.map(item => parseJsonFields(item, fields));
}
