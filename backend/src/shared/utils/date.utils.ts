/**
 * Generates an ISO-8601 UTC timestamp string with milliseconds.
 * Matches SQLite default format: YYYY-MM-DDTHH:MM:SS.sssZ
 */
export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates whether a given string is a valid ISO-8601 timestamp.
 */
export function isValidIsoTimestamp(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.endsWith('Z');
}
