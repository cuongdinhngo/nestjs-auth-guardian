import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MfaVerifiedGuard } from './mfa-verified.guard';

describe('MfaVerifiedGuard', () => {
  let guard: MfaVerifiedGuard;

  beforeEach(() => {
    guard = new MfaVerifiedGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when user is not authenticated (no MFA)', () => {
    const mockRequest = {
      user: { userId: 1, email: 'test@example.com', mfaEnabled: false },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access when MFA is enabled and verified', () => {
    const mockRequest = {
      user: {
        userId: 1,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaVerified: true,
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when user is not present', () => {
    const mockRequest = {};
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('User not authenticated');
  });

  it('should throw UnauthorizedException when MFA is enabled but not verified', () => {
    const mockRequest = {
      user: {
        userId: 1,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaVerified: false,
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('MFA verification required');
  });
});
