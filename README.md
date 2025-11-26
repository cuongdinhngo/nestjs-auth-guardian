# NestJS Auth Guardian

A comprehensive NestJS library for JWT authentication with MFA/TOTP support. Provides secure two-factor authentication with authenticator apps and backup codes.

## Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **MFA/TOTP Support** - Time-based one-time passwords with authenticator apps
- ✅ **Backup Codes** - 10 single-use recovery codes
- ✅ **Two-Step Login Flow** - Temporary tokens for MFA verification
- ✅ **TypeORM Integration** - Easy integration with existing User entities
- ✅ **@MfaEntity() Decorator** - Automatically adds MFA columns to your entities
- ✅ **Guards & Decorators** - JWT guards, MFA verification, role-based access
- ✅ **Type-Safe** - Full TypeScript support with interfaces and types
- ✅ **Compatible** - Works seamlessly with nestjs-social-auth

---

## Quick Start (2 Minutes)

### 1. Installation

```bash
npm install nestjs-auth-guardian @nestjs/jwt @nestjs/passport @nestjs/typeorm passport-jwt speakeasy qrcode bcrypt typeorm
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
MFA_ISSUER=Your App Name
```

### 3. Update Your User Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MfaEntity } from 'nestjs-auth-guardian';

@Entity('users')
@MfaEntity()  // Automatically adds mfaEnabled, mfaSecret, mfaBackupCodes
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name?: string;

  // MFA columns added by @MfaEntity():
  // - mfaEnabled: boolean
  // - mfaSecret?: string
  // - mfaBackupCodes?: string[]
}
```

### 4. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardianModule } from 'nestjs-auth-guardian';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({ /* your config */ }),
    AuthGuardianModule.forFeature(User),
  ],
})
export class AppModule {}
```

### 5. Use the Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, MfaVerifiedGuard } from 'nestjs-auth-guardian';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get('sensitive')
  @UseGuards(MfaVerifiedGuard)  // Requires MFA verification
  getSensitiveData(@CurrentUser() user: any) {
    return { message: 'This requires MFA' };
  }
}
```

That's it! Your app now has JWT authentication with MFA support.

---

## License

MIT
