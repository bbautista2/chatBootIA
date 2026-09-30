import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(['superadmin', 'admin'] as const)
  role?: 'superadmin' | 'admin';
}
