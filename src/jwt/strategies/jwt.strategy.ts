import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const config = getJwtConfig();
    if (!config) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  /**
   * Validate JWT payload
   * CRITICAL: Reject temporary tokens (used for MFA flow only)
   */
  async validate(payload: JwtPayload) {
    if (payload.temp === true) {
      throw new UnauthorizedException(
        'Temporary token cannot be used here. Please complete MFA verification.',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      mfaEnabled: payload.mfaEnabled,
      mfaVerified: payload.mfaVerified,
    };
  }
}
