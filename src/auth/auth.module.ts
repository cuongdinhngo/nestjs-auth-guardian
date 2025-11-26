import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthModule } from '../jwt/jwt.module';
import { MfaModule } from '../mfa/mfa.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({})
export class AuthGuardianModule {
  static forFeature(userEntity: any): DynamicModule {
    return {
      module: AuthGuardianModule,
      imports: [
        TypeOrmModule.forFeature([userEntity]),
        JwtAuthModule,
        MfaModule.forFeature(userEntity),
      ],
      controllers: [AuthController],
      providers: [AuthService],
      exports: [AuthService, JwtAuthModule],
    };
  }
}
