export class SetupMfaResponseDto {
  secret!: string;
  qrCode!: string;
  backupCodes!: string[];
}
