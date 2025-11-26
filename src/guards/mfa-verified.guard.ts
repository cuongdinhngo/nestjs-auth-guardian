import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * MFA Verified Guard
 * Ensures that the user has completed MFA verification
 * Use this guard on routes that require MFA verification
 */
@Injectable()
export class MfaVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.mfaEnabled && !user.mfaVerified) {
      throw new UnauthorizedException('MFA verification required');
    }

    return true;
  }
}
