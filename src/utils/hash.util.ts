import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password or string using bcrypt
 */
export async function hash(value: string): Promise<string> {
  return bcrypt.hash(value, SALT_ROUNDS);
}

/**
 * Compare a plain text value with a hashed value
 */
export async function compare(value: string, hashedValue: string): Promise<boolean> {
  return bcrypt.compare(value, hashedValue);
}

/**
 * Hash multiple values in parallel
 */
export async function hashMany(values: string[]): Promise<string[]> {
  return Promise.all(values.map((value) => hash(value)));
}
