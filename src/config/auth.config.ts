import { getJwtConfig, isJwtConfigured, getJwtConfigKeys } from './jwt.config';
import { getMfaConfig, isMfaConfigured, getMfaConfigKeys } from './mfa.config';

/**
 * Get all auth configuration
 */
export function getAuthConfig() {
  return {
    jwt: getJwtConfig(),
    mfa: getMfaConfig(),
  };
}

/**
 * Check if auth is fully configured
 */
export function isAuthConfigured(): boolean {
  return isJwtConfigured();
}

/**
 * Get all required configuration keys
 */
export function getAllConfigKeys(): {
  jwt: string[];
  mfa: string[];
} {
  return {
    jwt: getJwtConfigKeys(),
    mfa: getMfaConfigKeys(),
  };
}
