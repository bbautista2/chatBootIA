import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiIntegrationService } from '../ai-integration/ai-integration.service';

export interface FlowResponse {
  text?: string;
  buttons?: Array<{ title: string; payload: string }>;
  handoff?: boolean;
  nextStepId?: string;
  imageUrl?: string;
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiIntegrationService,
  ) {}

  async processMessage(
    accountId: string,
    messageText: string,
    conversationId: string,
    isFirstMessage: boolean = false,
    postbackPayload?: string,
  ): Promise<FlowResponse> {
    const flows = await this.prisma.flow.findMany({
      where: { accountId, isActive: true },
      include: {
        triggers: true,
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { priority: 'desc' },
    });

    for (const flow of flows) {
      const matched = this.checkTriggerMatch(
        flow.triggers,
        messageText,
        isFirstMessage,
        postbackPayload,
      );

      if (matched && flow.steps.length > 0) {
        const firstStep = flow.steps[0];
        return this.parseStepContent(firstStep);
      }
    }

    const botConfig = await this.prisma.botConfig.findUnique({
      where: { accountId },
    });

    if (botConfig?.aiEnabled) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 20,
          },
        },
      });

      if (conversation) {
        const history = conversation.messages.map((m) => ({
          role: (m.direction === 'out' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: (m.content as any)?.text || '',
        }));

        const aiResponse = await this.aiService.generateResponse(
          accountId,
          history,
          messageText,
        );

        if (aiResponse) {
          return { text: aiResponse };
        }
      }
    }

    const fallbackMessage = botConfig?.fallbackMessage || 'Lo siento, no pude procesar tu mensaje.';
    return { text: fallbackMessage };
  }

  private checkTriggerMatch(
    triggers: any[],
    messageText: string,
    isFirstMessage: boolean,
    postbackPayload?: string,
  ): boolean {
    for (const trigger of triggers) {
      switch (trigger.type) {
        case 'keyword': {
          const keyword = trigger.value.toLowerCase();
          const text = (messageText || '').toLowerCase();
          if (text === keyword || text.includes(keyword)) {
            return true;
          }
          break;
        }
        case 'first_message':
          if (isFirstMessage) {
            return true;
          }
          break;
        case 'postback':
          if (postbackPayload && postbackPayload === trigger.value) {
            return true;
          }
          break;
        case 'comment':
          return true;
      }
    }
    return false;
  }

  private parseStepContent(step: any): FlowResponse {
    const content = step.content as any;

    switch (step.type) {
      case 'text':
        return { text: content?.text || content?.message || '' };

      case 'buttons':
        return {
          text: content?.text || '',
          buttons: content?.buttons || [],
        };

      case 'image':
        return {
          imageUrl: content?.url || content?.imageUrl || '',
          text: content?.text,
        };

      case 'carousel':
        return {
          text: content?.text,
          buttons: content?.items?.map((item: any) => ({
            title: item.title || '',
            payload: item.payload || '',
          })) || [],
        };

      case 'handoff':
        return { handoff: true, text: content?.text || 'Un agente te atenderá pronto.' };

      default:
        return { text: content?.text || '' };
    }
  }

  async getNextStep(currentStepId: string): Promise<FlowResponse | null> {
    const currentStep = await this.prisma.flowStep.findUnique({
      where: { id: currentStepId },
    });

    if (!currentStep?.nextStepId) {
      return null;
    }

    const nextStep = await this.prisma.flowStep.findUnique({
      where: { id: currentStep.nextStepId },
    });

    if (!nextStep) {
      return null;
    }

    return this.parseStepContent(nextStep);
  }
}
