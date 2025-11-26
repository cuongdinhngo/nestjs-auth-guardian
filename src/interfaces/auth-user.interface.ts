export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  password?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
