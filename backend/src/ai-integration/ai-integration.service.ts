import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiIntegrationService {
  private readonly logger = new Logger(AiIntegrationService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateResponse(
    accountId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentMessage: string,
  ): Promise<string | null> {
    try {
      const botConfig = await this.prisma.botConfig.findUnique({
        where: { accountId },
      });

      if (!botConfig?.aiEnabled || !botConfig.aiPrompt) {
        return null;
      }

      if (!this.openai) {
        this.logger.warn('OpenAI not configured');
        return null;
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: botConfig.aiPrompt,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: currentMessage,
        },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        return null;
      }

      await this.prisma.log.create({
        data: {
          accountId,
          level: 'info',
          message: 'AI response generated',
          meta: { model: 'gpt-3.5-turbo', tokens: completion.usage?.total_tokens },
        },
      });

      return response;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);

      await this.prisma.log.create({
        data: {
          accountId,
          level: 'error',
          message: `AI generation failed: ${error.message}`,
        },
      });

      return null;
    }
  }
}
