import * as bcrypt from 'bcrypt';

/**
 * Hashes plain text password with a standard bcrypt work factor.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares plain password against an existing bcrypt hash.
 */
export function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
