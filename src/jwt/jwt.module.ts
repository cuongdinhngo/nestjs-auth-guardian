import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getJwtConfig } from '../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthService } from './jwt.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtConfig()?.secret || 'default-secret-change-me',
      signOptions: {
        expiresIn: (getJwtConfig()?.expiresIn || '15m') as any,
      },
    }),
  ],
  providers: [JwtStrategy, JwtAuthService],
  exports: [JwtAuthService, PassportModule, JwtModule],
})
export class JwtAuthModule {}
