export interface MfaConfig {
  issuer: string;
}

/**
 * Get MFA configuration from environment variables
 */
export function getMfaConfig(): MfaConfig {
  return {
    issuer: process.env.MFA_ISSUER || 'NestJS Auth Guardian',
  };
}

/**
 * Check if MFA is configured (issuer is set)
 */
export function isMfaConfigured(): boolean {
  return !!process.env.MFA_ISSUER;
}

/**
 * Get all MFA environment variable names
 */
export function getMfaConfigKeys(): string[] {
  return ['MFA_ISSUER'];
}
