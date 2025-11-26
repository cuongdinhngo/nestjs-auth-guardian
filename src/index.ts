// Modules
export { AuthGuardianModule } from './auth/auth.module';
export { JwtAuthModule } from './jwt/jwt.module';
export { MfaModule } from './mfa/mfa.module';

// Services
export { AuthService } from './auth/auth.service';
export { JwtAuthService } from './jwt/jwt.service';
export { MfaService } from './mfa/mfa.service';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { MfaVerifiedGuard } from './guards/mfa-verified.guard';

// Decorators
export { CurrentUser } from './decorators/current-user.decorator';
export { MfaEntity } from './decorators/mfa-entity.decorator';
export { Public } from './decorators/public.decorator';
export { Roles } from './decorators/roles.decorator';

// Strategies
export { JwtStrategy } from './jwt/strategies/jwt.strategy';

// Config
export { getJwtConfig, isJwtConfigured, getJwtConfigKeys } from './config/jwt.config';
export { getMfaConfig, isMfaConfigured, getMfaConfigKeys } from './config/mfa.config';
export { getAuthConfig, isAuthConfigured, getAllConfigKeys } from './config/auth.config';

// Interfaces
export type { JwtPayload } from './interfaces/jwt-payload.interface';
export type { AuthUser } from './interfaces/auth-user.interface';
export type { JwtConfig } from './config/jwt.config';
export type { MfaConfig } from './config/mfa.config';

// DTOs
export { LoginDto } from './auth/dto/login.dto';
export { RegisterDto } from './auth/dto/register.dto';
export { EnableMfaDto } from './mfa/dto/enable-mfa.dto';
export { DisableMfaDto } from './mfa/dto/disable-mfa.dto';
export { VerifyMfaDto } from './mfa/dto/verify-mfa.dto';
export { SetupMfaResponseDto } from './mfa/dto/setup-mfa-response.dto';

// Utils
export { hash, compare, hashMany } from './utils/hash.util';
