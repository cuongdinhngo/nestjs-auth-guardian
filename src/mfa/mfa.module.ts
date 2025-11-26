import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';

@Module({})
export class MfaModule {
  static forFeature(userEntity: any): DynamicModule {
    return {
      module: MfaModule,
      imports: [TypeOrmModule.forFeature([userEntity])],
      controllers: [MfaController],
      providers: [MfaService],
      exports: [MfaService],
    };
  }
}
