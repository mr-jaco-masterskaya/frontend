export type ParsedOrderAddress = { street: string; home: string };

/** Parses the existing combined “street house” input without changing its UI shape. */
export function splitStreetAndHome(value: string): ParsedOrderAddress | null {
  const normalized = value.trim().replace(/,\s*$/, '');
  const match = normalized.match(/^(.+?)[,\s]+(\d+[А-Яа-яA-Za-z]?(?:[/-]\d+[А-Яа-яA-Za-z]?)?)$/);
  if (!match) return null;
  const street = match[1].trim().replace(/,\s*$/, '').trim();
  return street ? { street, home: match[2] } : null;
}

export function normalizeHome(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}
