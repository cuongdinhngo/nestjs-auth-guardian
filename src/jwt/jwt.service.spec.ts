import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtAuthService } from './jwt.service';

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '15m' as any },
        }),
      ],
      providers: [JwtAuthService],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: false,
      };

      const token = service.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.decode(token) as any;
      expect(decoded.sub).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.mfaEnabled).toBe(false);
    });
  });

  describe('generateTempToken', () => {
    it('should generate a temp token with 5m expiry', () => {
      const token = service.generateTempToken(1, 'test@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.decode(token) as any;
      expect(decoded.sub).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.temp).toBe(true);
      expect(decoded.mfaEnabled).toBe(true);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: false,
      };

      const token = service.generateAccessToken(payload);
      const verified = service.verifyToken(token);

      expect(verified.sub).toBe(1);
      expect(verified.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', () => {
      expect(() => service.verifyToken('invalid-token')).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        mfaEnabled: false,
      };

      const token = service.generateAccessToken(payload);
      const decoded = service.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(1);
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const decoded = service.decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
