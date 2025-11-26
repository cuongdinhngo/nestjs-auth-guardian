import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { hash, compare, hashMany } from '../utils/hash.util';
import { getMfaConfig } from '../config/mfa.config';
import { SetupMfaResponseDto } from './dto/setup-mfa-response.dto';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class MfaService<T extends AuthUser = AuthUser> {
  constructor(
    @InjectRepository('User' as any)
    private readonly userRepository: Repository<T>,
  ) {}

  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret(): string {
    const config = getMfaConfig();
    const secret = speakeasy.generateSecret({
      length: 32,
      name: config.issuer,
    });
    return secret.base32;
  }

  /**
   * Generate QR code for authenticator app
   */
  async generateQRCode(secret: string, email: string): Promise<string> {
    const config = getMfaConfig();
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,
      label: email,
      issuer: config.issuer,
      encoding: 'base32',
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });
  }

  /**
   * Generate 10 backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const part1 = this.generateRandomCode(6);
      const part2 = this.generateRandomCode(6);
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  }

  /**
   * Helper to generate cryptographically secure random alphanumeric code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
  }

  /**
   * Hash backup codes before storing
   */
  async hashBackupCodes(codes: string[]): Promise<string[]> {
    return hashMany(codes);
  }

  /**
   * Setup MFA for a user (generate secret and QR code)
   */
  async setupMfa(userId: number): Promise<SetupMfaResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId } as any,
      select: ['id', 'email', 'mfaEnabled'] as any,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException(
        'MFA is already enabled. Disable it first to regenerate codes.',
      );
    }

    const secret = this.generateSecret();
    const qrCode = await this.generateQRCode(secret, user.email);
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    await this.userRepository.update(userId, {
      mfaSecret: secret,
      mfaBackupCodes: hashedBackupCodes,
    } as any);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMfa(userId: number, code: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId } as any,
      select: ['id', 'mfaEnabled', 'mfaSecret'] as any,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Call /mfa/setup first.',
      );
    }

    const isValid = this.verifyToken(user.mfaSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.userRepository.update(userId, {
      mfaEnabled: true,
    } as any);
  }

  /**
   * Disable MFA
   */
  async disableMfa(
    userId: number,
    code: string,
    password: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId } as any,
      select: ['id', 'password', 'mfaEnabled', 'mfaSecret'] as any,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.password) {
      throw new BadRequestException(
        'This account uses OAuth. Cannot disable MFA without password.',
      );
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA secret not found');
    }

    const isCodeValid = this.verifyToken(user.mfaSecret, code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.userRepository.update(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    } as any);
  }

  /**
   * Verify MFA code during login (tries TOTP first, then backup codes)
   */
  async verifyMfaForLogin(userId: number, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId } as any,
      select: ['id', 'mfaEnabled', 'mfaSecret', 'mfaBackupCodes'] as any,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    const isTotpValid = this.verifyToken(user.mfaSecret, code);
    if (isTotpValid) {
      return true;
    }

    if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      const backupCodeValid = await this.verifyAndConsumeBackupCode(
        userId,
        code,
        user.mfaBackupCodes,
      );
      if (backupCodeValid) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify and consume a backup code (single-use)
   */
  private async verifyAndConsumeBackupCode(
    userId: number,
    code: string,
    hashedCodes: string[],
  ): Promise<boolean> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await compare(code, hashedCodes[i]);
      if (isMatch) {
        hashedCodes.splice(i, 1);
        await this.userRepository.update(userId, {
          mfaBackupCodes: hashedCodes,
        } as any);
        return true;
      }
    }
    return false;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: number, code: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId } as any,
      select: ['id', 'mfaEnabled', 'mfaSecret'] as any,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = this.verifyToken(user.mfaSecret, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    await this.userRepository.update(userId, {
      mfaBackupCodes: hashedBackupCodes,
    } as any);

    return backupCodes;
  }
}
