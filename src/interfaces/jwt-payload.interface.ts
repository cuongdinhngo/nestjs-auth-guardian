export interface JwtPayload {
  sub: number;
  email: string;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
  temp?: boolean;
  iat?: number;
  exp?: number;
}
