import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { EnableMfaDto } from './dto/enable-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
import { SetupMfaResponseDto } from './dto/setup-mfa-response.dto';

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  /**
   * Setup MFA - Generate secret, QR code, and backup codes
   * Requires authentication
   */
  @Post('setup')
  async setup(@Req() req: any): Promise<SetupMfaResponseDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.mfaService.setupMfa(userId);
  }

  /**
   * Enable MFA after verifying TOTP code
   * Requires authentication
   */
  @Post('enable')
  async enable(
    @Req() req: any,
    @Body() enableMfaDto: EnableMfaDto,
  ): Promise<{ message: string }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await this.mfaService.enableMfa(userId, enableMfaDto.code);
    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA (requires password + TOTP code)
   * Requires authentication
   */
  @Post('disable')
  async disable(
    @Req() req: any,
    @Body() disableMfaDto: DisableMfaDto,
  ): Promise<{ message: string }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await this.mfaService.disableMfa(
      userId,
      disableMfaDto.code,
      disableMfaDto.password,
    );
    return { message: 'MFA disabled successfully' };
  }

  /**
   * Regenerate backup codes
   * Requires authentication and TOTP verification
   */
  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(
    @Req() req: any,
    @Body() body: { code: string },
  ): Promise<{ backupCodes: string[] }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const backupCodes = await this.mfaService.regenerateBackupCodes(
      userId,
      body.code,
    );
    return { backupCodes };
  }
}
