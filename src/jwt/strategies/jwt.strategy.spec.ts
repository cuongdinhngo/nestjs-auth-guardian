import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data for valid non-temp token', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: false,
        temp: false,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        mfaEnabled: false,
        mfaVerified: undefined,
      });
    });

    it('should return user data with mfaVerified for MFA users', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaVerified: true,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaVerified: true,
      });
    });

    it('should throw UnauthorizedException for temp tokens', async () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: true,
        temp: true,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Temporary token cannot be used here',
      );
    });
  });

  it('should throw error when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy()).toThrow('JWT_SECRET is not configured');
  });
});
