/**
 * Retrieves a required environment variable.
 * Throws at startup if the variable is missing or empty — fail-fast pattern.
 *
 * @example
 *   const dbUrl = requireEnv('DATABASE_URL');
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(
      `[config] Missing required environment variable: "${key}". ` +
        `Check your .env file or container environment.`,
    );
  }
  return value;
}

/**
 * Retrieves an optional environment variable with a default fallback.
 *
 * @example
 *   const port = getEnv('PORT', '3000');
 */
export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Parses a numeric environment variable.
 * Throws if the variable is required but missing, or if the value is not a valid integer.
 */
export function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `[config] Environment variable "${key}" must be an integer, got: "${raw}"`,
    );
  }
  return parsed;
}

/**
 * Parses a boolean environment variable.
 * Accepts: 'true' | '1' | 'yes' → true; anything else → false.
 */
export function getEnvBool(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  return ['true', '1', 'yes'].includes(raw.toLowerCase());
}

/**
 * Parses a comma-separated environment variable into a string array.
 *
 * @example
 *   KAFKA_BROKERS=kafka1:9092,kafka2:9092
 *   const brokers = getEnvList('KAFKA_BROKERS', ['localhost:9092']);
 */
export function getEnvList(key: string, defaultValue: string[]): string[] {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  return raw
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
}
