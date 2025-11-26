export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret?: string;
  refreshExpiresIn?: string;
}

/**
 * Get JWT configuration from environment variables
 */
export function getJwtConfig(): JwtConfig | null {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  return {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

/**
 * Check if JWT is configured
 */
export function isJwtConfigured(): boolean {
  return !!process.env.JWT_SECRET;
}

/**
 * Get all configured JWT environment variable names
 */
export function getJwtConfigKeys(): string[] {
  return [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
  ];
}
