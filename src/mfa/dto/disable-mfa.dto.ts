import { IsString, Length, MinLength } from 'class-validator';

export class DisableMfaDto {
  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
