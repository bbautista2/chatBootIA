import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SendMessageDto {
  @IsString()
  recipientId: string;

  @IsEnum(['text', 'image', 'interactive'] as const)
  type: 'text' | 'image' | 'interactive';

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  buttons?: Array<{ title: string; payload: string }>;

  @IsOptional()
  @IsString()
  nextStepId?: string;
}
