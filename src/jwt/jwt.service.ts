import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getJwtConfig } from '../config/jwt.config';

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: NestJwtService) {}

  /**
   * Generate standard access token
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Generate temporary token for MFA flow (5 minutes)
   */
  generateTempToken(userId: number, email: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        mfaEnabled: true,
        temp: true,
      },
      { expiresIn: '5m' },
    );
  }

  /**
   * Generate refresh token (optional)
   */
  generateRefreshToken(userId: number, email: string): string | null {
    const config = getJwtConfig();
    if (!config?.refreshSecret) {
      return null;
    }

    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: config.refreshSecret,
        expiresIn: (config.refreshExpiresIn || '7d') as any,
      },
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JwtPayload | null {
    const config = getJwtConfig();
    if (!config?.refreshSecret) {
      return null;
    }

    return this.jwtService.verify<JwtPayload>(token, {
      secret: config.refreshSecret,
    });
  }

  /**
   * Decode token without verification (useful for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token) as JwtPayload | null;
  }
}
