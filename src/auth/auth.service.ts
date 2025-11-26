import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import { hash, compare } from '../utils/hash.util';
import { JwtAuthService } from '../jwt/jwt.service';
import { AuthUser } from '../interfaces/auth-user.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService<T extends AuthUser = AuthUser> {
  constructor(
    private readonly jwtAuthService: JwtAuthService,
    @InjectRepository('User' as any)
    private readonly userRepository: Repository<T>,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email } as any,
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await hash(registerDto.password);
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      mfaEnabled: false,
    } as any);

    const savedUser = await this.userRepository.save(user as any);

    const accessToken = this.jwtAuthService.generateAccessToken({
      sub: (savedUser as any).id,
      email: (savedUser as any).email,
      mfaEnabled: false,
    });

    return {
      accessToken,
      user: this.sanitizeUser(savedUser as any),
    };
  }

  /**
   * Login with email and password
   * Returns temp token if MFA is enabled, otherwise returns full access token
   */
  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email } as any,
      select: ['id', 'email', 'password', 'name', 'mfaEnabled'] as any,
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      const tempToken = this.jwtAuthService.generateTempToken(
        user.id,
        user.email,
      );
      return {
        requiresMfa: true,
        tempToken,
        message: 'MFA verification required',
      };
    }

    const accessToken = this.jwtAuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      mfaEnabled: false,
    });

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Verify MFA code and issue full JWT token
   */
  async verifyMfaAndLogin(tempToken: string, code: string) {
    let payload: any;
    try {
      payload = this.jwtAuthService.verifyToken(tempToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (!payload.temp) {
      throw new UnauthorizedException('Invalid temporary token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub } as any,
      select: [
        'id',
        'name',
        'email',
        'mfaEnabled',
        'mfaSecret',
        'mfaBackupCodes',
      ] as any,
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled for this user');
    }

    const isValid = await this.verifyMfaCode(user, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const accessToken = this.jwtAuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      mfaEnabled: true,
      mfaVerified: true,
    });

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Inline MFA verification logic (to avoid circular dependency)
   */
  private async verifyMfaCode(user: T, code: string): Promise<boolean> {
    if (!user.mfaSecret) {
      return false;
    }

    const isTotpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (isTotpValid) {
      return true;
    }

    if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      for (let i = 0; i < user.mfaBackupCodes.length; i++) {
        const isMatch = await compare(code, user.mfaBackupCodes[i]);
        if (isMatch) {
          user.mfaBackupCodes.splice(i, 1);
          await this.userRepository.update(user.id, {
            mfaBackupCodes: user.mfaBackupCodes,
          } as any);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate user by ID (for JWT strategy)
   */
  async validateUser(userId: number): Promise<T | null> {
    return this.userRepository.findOne({ where: { id: userId } as any });
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: T): Partial<T> {
    const { password, mfaSecret, mfaBackupCodes, ...sanitized } = user as any;
    return sanitized;
  }
}
