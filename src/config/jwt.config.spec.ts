import { getJwtConfig, isJwtConfigured, getJwtConfigKeys } from './jwt.config';

describe('JWT Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getJwtConfig', () => {
    it('should return null when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const config = getJwtConfig();
      expect(config).toBeNull();
    });

    it('should return config with default values when only JWT_SECRET is set', () => {
      process.env.JWT_SECRET = 'test-secret';
      const config = getJwtConfig();

      expect(config).toEqual({
        secret: 'test-secret',
        expiresIn: '15m',
        refreshSecret: undefined,
        refreshExpiresIn: '7d',
      });
    });

    it('should return config with all values when all env vars are set', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '30m';
      process.env.JWT_REFRESH_SECRET = 'refresh-secret';
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';

      const config = getJwtConfig();

      expect(config).toEqual({
        secret: 'test-secret',
        expiresIn: '30m',
        refreshSecret: 'refresh-secret',
        refreshExpiresIn: '14d',
      });
    });
  });

  describe('isJwtConfigured', () => {
    it('should return false when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      expect(isJwtConfigured()).toBe(false);
    });

    it('should return true when JWT_SECRET is set', () => {
      process.env.JWT_SECRET = 'test-secret';
      expect(isJwtConfigured()).toBe(true);
    });
  });

  describe('getJwtConfigKeys', () => {
    it('should return all JWT config environment variable names', () => {
      const keys = getJwtConfigKeys();
      expect(keys).toEqual([
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'JWT_REFRESH_SECRET',
        'JWT_REFRESH_EXPIRES_IN',
      ]);
    });
  });
});
