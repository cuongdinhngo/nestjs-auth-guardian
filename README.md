# NestJS Auth Guardian

A comprehensive NestJS library for JWT authentication with MFA/TOTP support. Provides secure two-factor authentication with authenticator apps and backup codes.

## Features

- ✅ **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- ✅ **MFA/TOTP Support** - Time-based one-time passwords with authenticator apps (Google Authenticator, Authy, etc.)
- ✅ **Backup Codes** - 10 single-use recovery codes in ABC123-DEF456 format
- ✅ **Two-Step Login Flow** - Temporary tokens for MFA verification (5-minute expiry)
- ✅ **TypeORM Integration** - Easy integration with existing User entities
- ✅ **@MfaEntity() Decorator** - Automatically adds MFA columns to your entities
- ✅ **Guards & Decorators** - JWT guards, MFA verification, role-based access control
- ✅ **Type-Safe** - Full TypeScript support with interfaces and types
- ✅ **Compatible** - Works seamlessly with nestjs-social-auth
- ✅ **Secure** - Bcrypt password hashing, backup code hashing, temporary token rejection

---

## Table of Contents

- [Quick Start](#quick-start-2-minutes)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [User Entity Setup](#user-entity-setup)
  - [Module Registration](#module-registration)
  - [Authentication Endpoints](#authentication-endpoints)
  - [MFA Endpoints](#mfa-endpoints)
  - [Guards & Decorators](#guards--decorators)
- [Two-Step Login Flow](#two-step-login-flow)
- [API Reference](#api-reference)
- [Testing](#testing)
- [License](#license)

---

## Quick Start (2 Minutes)

### 1. Installation

```bash
npm install nestjs-auth-guardian @nestjs/jwt @nestjs/passport @nestjs/typeorm passport-jwt speakeasy qrcode bcrypt typeorm class-validator class-transformer
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
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

## Installation

### Using npm

```bash
npm install nestjs-auth-guardian @nestjs/jwt @nestjs/passport @nestjs/typeorm passport-jwt speakeasy qrcode bcrypt typeorm class-validator class-transformer
```

### Using yarn

```bash
yarn add nestjs-auth-guardian @nestjs/jwt @nestjs/passport @nestjs/typeorm passport-jwt speakeasy qrcode bcrypt typeorm class-validator class-transformer
```

### Using the Integration Script

```bash
npx nestjs-auth-guardian-integrate
```

This will automatically:
- Copy all necessary files to your project
- Install required dependencies
- Create a `.env.example` file

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# JWT Configuration (Required)
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m

# JWT Refresh Token (Optional)
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# MFA Configuration (Required for MFA)
MFA_ISSUER=Your App Name
```

### Configuration Options

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token expiration time |
| `JWT_REFRESH_SECRET` | No | - | Secret key for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiration time |
| `MFA_ISSUER` | Yes | - | Issuer name shown in authenticator apps |

---

## Usage

### User Entity Setup

Apply the `@MfaEntity()` decorator to your User entity:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MfaEntity } from 'nestjs-auth-guardian';
import { Exclude } from 'class-transformer';

@Entity('users')
@MfaEntity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  name?: string;

  // The following columns are automatically added by @MfaEntity():
  // mfaEnabled: boolean = false
  // mfaSecret?: string (nullable, not selected by default)
  // mfaBackupCodes?: string[] (nullable, not selected by default)
}
```

### Module Registration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardianModule } from 'nestjs-auth-guardian';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'myapp',
      entities: [User],
      synchronize: true, // Don't use in production
    }),
    AuthGuardianModule.forFeature(User),
  ],
})
export class AppModule {}
```

### Authentication Endpoints

The package automatically provides these endpoints:

#### POST `/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "mfaEnabled": false
  }
}
```

#### POST `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (MFA Disabled):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "mfaEnabled": false
  }
}
```

**Response (MFA Enabled):**
```json
{
  "requiresMfa": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "MFA verification required"
}
```

#### POST `/auth/mfa/verify`

Verify MFA code and complete login (second step for MFA-enabled users).

**Request Body:**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "mfaEnabled": true
  }
}
```

### MFA Endpoints

All MFA endpoints require authentication via `JwtAuthGuard`.

#### POST `/auth/mfa/setup`

Start MFA setup (generates QR code).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": [
    "ABC123-DEF456",
    "GHI789-JKL012",
    "..."
  ]
}
```

#### POST `/auth/mfa/enable`

Enable MFA after setup.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "MFA enabled successfully"
}
```

#### POST `/auth/mfa/disable`

Disable MFA.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "code": "123456",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "MFA disabled successfully"
}
```

#### POST `/auth/mfa/backup-codes/regenerate`

Regenerate backup codes.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "backupCodes": [
    "ABC123-DEF456",
    "GHI789-JKL012",
    "..."
  ]
}
```

### Guards & Decorators

#### JwtAuthGuard

Protects routes requiring authentication.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'nestjs-auth-guardian';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get()
  protectedRoute() {
    return { message: 'This is protected' };
  }
}
```

#### @Public() Decorator

Mark routes as public (skip JwtAuthGuard).

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Public } from 'nestjs-auth-guardian';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  @Get('public')
  @Public()
  publicRoute() {
    return { message: 'This is public' };
  }

  @Get('protected')
  protectedRoute() {
    return { message: 'This requires auth' };
  }
}
```

#### MfaVerifiedGuard

Ensures user has completed MFA verification.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, MfaVerifiedGuard } from 'nestjs-auth-guardian';

@Controller('sensitive')
@UseGuards(JwtAuthGuard, MfaVerifiedGuard)
export class SensitiveController {
  @Get()
  sensitiveData() {
    return { message: 'Requires MFA verification' };
  }
}
```

#### @CurrentUser() Decorator

Extract authenticated user from request.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from 'nestjs-auth-guardian';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.userId,
      email: user.email,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
```

#### @Roles() Decorator

Define required roles for RBAC.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles } from 'nestjs-auth-guardian';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  @Get()
  @Roles('admin')
  adminOnly() {
    return { message: 'Admin access only' };
  }
}
```

---

## Two-Step Login Flow

When MFA is enabled, login follows a two-step process:

### Step 1: Initial Login

User submits credentials to `/auth/login`:

```typescript
// Request
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (MFA enabled)
{
  "requiresMfa": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "MFA verification required"
}
```

The `tempToken` has these characteristics:
- **Short expiry**: 5 minutes
- **Limited scope**: Contains `temp: true` flag
- **Cannot access protected routes**: JwtStrategy rejects it with error
- **Single purpose**: Only valid for `/auth/mfa/verify` endpoint

### Step 2: MFA Verification

User submits temp token + MFA code to `/auth/mfa/verify`:

```typescript
// Request
POST /auth/mfa/verify
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"  // From authenticator app or backup code
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "mfaEnabled": true
  }
}
```

The final `accessToken` contains:
- **Standard expiry**: 15 minutes (configurable)
- **Full scope**: `mfaVerified: true` flag
- **Access all routes**: Works with JwtAuthGuard and MfaVerifiedGuard

### Security Features

1. **Temp Token Rejection**: The JwtStrategy explicitly rejects temporary tokens:
   ```typescript
   if (payload.temp === true) {
     throw new UnauthorizedException(
       'Temporary token cannot be used here. Please complete MFA verification.',
     );
   }
   ```

2. **Backup Codes**: Users can use backup codes instead of TOTP codes:
   - 10 single-use codes generated during MFA setup
   - Format: `ABC123-DEF456`
   - Hashed with bcrypt before storage
   - Consumed after single use
   - Can be regenerated anytime

3. **Clock Drift Tolerance**: TOTP verification uses a 2-step window (±60 seconds).

---

## API Reference

### Services

#### AuthService

```typescript
import { AuthService } from 'nestjs-auth-guardian';

class AuthService {
  // Register new user
  register(registerDto: RegisterDto): Promise<{ accessToken: string; user: any }>;

  // Login (returns temp token if MFA enabled)
  login(loginDto: LoginDto): Promise<{
    requiresMfa?: boolean;
    tempToken?: string;
    accessToken?: string;
    user?: any;
    message?: string;
  }>;

  // Verify MFA and complete login
  verifyMfaAndLogin(tempToken: string, code: string): Promise<{
    accessToken: string;
    user: any;
  }>;
}
```

#### JwtAuthService

```typescript
import { JwtAuthService } from 'nestjs-auth-guardian';

class JwtAuthService {
  // Generate access token
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;

  // Generate temporary token (5min expiry)
  generateTempToken(userId: number, email: string): string;

  // Generate refresh token
  generateRefreshToken(userId: number, email: string): string | null;

  // Verify and decode token
  verifyToken(token: string): JwtPayload;

  // Decode token without verification
  decodeToken(token: string): JwtPayload | null;
}
```

#### MfaService

```typescript
import { MfaService } from 'nestjs-auth-guardian';

class MfaService {
  // Generate MFA secret
  generateSecret(): string;

  // Generate QR code for authenticator apps
  generateQRCode(secret: string, email: string): Promise<string>;

  // Verify TOTP code
  verifyToken(secret: string, token: string): boolean;

  // Generate 10 backup codes
  generateBackupCodes(): string[];

  // Hash backup codes with bcrypt
  hashBackupCodes(codes: string[]): Promise<string[]>;

  // Setup MFA (generate secret, QR, backup codes)
  setupMfa(userId: number): Promise<SetupMfaResponseDto>;

  // Enable MFA after verification
  enableMfa(userId: number, code: string): Promise<void>;

  // Disable MFA
  disableMfa(userId: number, code: string, password: string): Promise<void>;

  // Verify MFA for login (TOTP or backup code)
  verifyMfaForLogin(userId: number, code: string): Promise<boolean>;

  // Regenerate backup codes
  regenerateBackupCodes(userId: number, code: string): Promise<string[]>;
}
```

### Interfaces

#### JwtPayload

```typescript
interface JwtPayload {
  sub: number;           // User ID
  email: string;         // User email
  mfaEnabled: boolean;   // MFA enabled status
  mfaVerified?: boolean; // MFA verified status
  temp?: boolean;        // Temporary token flag
  iat?: number;          // Issued at
  exp?: number;          // Expiration time
}
```

#### AuthUser

```typescript
interface AuthUser {
  userId: number;
  email: string;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
}
```

### DTOs

#### RegisterDto

```typescript
class RegisterDto {
  email: string;
  password: string;
  name?: string;
}
```

#### LoginDto

```typescript
class LoginDto {
  email: string;
  password: string;
}
```

#### VerifyMfaDto

```typescript
class VerifyMfaDto {
  tempToken: string;
  code: string;
}
```

#### EnableMfaDto

```typescript
class EnableMfaDto {
  code: string;
}
```

#### DisableMfaDto

```typescript
class DisableMfaDto {
  code: string;
  password: string;
}
```

---

## Testing

The package includes comprehensive test coverage:

### Run Unit Tests

```bash
npm test
```

**Coverage:**
- JWT configuration and validation
- Password hashing utilities
- JWT service (token generation, verification)
- JWT strategy (temp token rejection)
- Guards (JwtAuthGuard, MfaVerifiedGuard)
- Decorators

### Run E2E Tests

```bash
npm run test:e2e
```

**Coverage:**
- @MfaEntity decorator functionality
- Module integration

### Test Results

```
Test Suites: 7 passed, 7 total
Tests:       35 passed, 35 total
```

---

## Advanced Usage

### Custom User Repository

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from 'nestjs-auth-guardian';
import { User } from './user.entity';

@Injectable()
export class CustomAuthService {
  constructor(
    private authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async customLogin(email: string, password: string) {
    // Custom pre-login logic
    const user = await this.userRepository.findOne({ where: { email } });

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }

    // Use built-in login
    return this.authService.login({ email, password });
  }
}
```

### Global JWT Guard

Apply JwtAuthGuard globally:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'nestjs-auth-guardian';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

Then use `@Public()` to mark public routes.

### Custom JWT Claims

```typescript
import { JwtAuthService } from 'nestjs-auth-guardian';

@Injectable()
export class CustomTokenService {
  constructor(private jwtAuthService: JwtAuthService) {}

  generateCustomToken(user: User) {
    return this.jwtAuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      mfaEnabled: user.mfaEnabled,
      // Custom claims
      role: user.role,
      permissions: user.permissions,
    } as any);
  }
}
```

---

## Compatibility

### Works With

- NestJS 10.x
- TypeORM 0.3.x
- Node.js 18+
- PostgreSQL, MySQL, SQLite, etc.
- [nestjs-social-auth](https://www.npmjs.com/package/nestjs-social-auth) - Compatible JWT tokens

### TypeScript Support

Full TypeScript support with type definitions included.

---

## Security Best Practices

1. **JWT Secrets**: Use strong, randomly generated secrets (min 32 characters)
2. **Environment Variables**: Never commit `.env` files to version control
3. **Password Hashing**: Bcrypt with default salt rounds (10)
4. **Backup Codes**: Hashed before storage, single-use only
5. **Temp Tokens**: Short 5-minute expiry, rejected by JwtStrategy
6. **HTTPS**: Always use HTTPS in production
7. **Rate Limiting**: Consider adding rate limiting to auth endpoints

---

## Troubleshooting

### "JWT_SECRET is not configured"

Ensure `.env` file exists with `JWT_SECRET` set:
```env
JWT_SECRET=your-super-secret-key-min-32-chars
```

### "MFA_ISSUER is not configured"

Add `MFA_ISSUER` to `.env`:
```env
MFA_ISSUER=Your App Name
```

### "Temporary token cannot be used here"

This is expected behavior. Temp tokens from login can only be used with `/auth/mfa/verify`.

### TypeORM Column Type Errors

Ensure you're using TypeORM 0.3.x and the `@MfaEntity()` decorator is applied to your User entity.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

MIT

---

## Author

Created with ❤️ for the NestJS community.

## Links

- [GitHub Repository](https://github.com/yourusername/nestjs-auth-guardian)
- [npm Package](https://www.npmjs.com/package/nestjs-auth-guardian)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
