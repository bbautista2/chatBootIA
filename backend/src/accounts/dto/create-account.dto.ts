import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsString()
  igUserId: string;

  @IsString()
  pageId: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'error'] as const)
  status?: 'active' | 'inactive' | 'error';
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'error'] as const)
  status?: 'active' | 'inactive' | 'error';
}

export class UpdateBotConfigDto {
  @IsOptional()
  aiEnabled?: boolean;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @IsOptional()
  businessHours?: any;

  @IsOptional()
  @IsString()
  fallbackMessage?: string;
}
