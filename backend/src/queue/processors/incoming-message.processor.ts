import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from '../../contacts/contacts.service';
import { FlowEngineService } from '../../flow-engine/flow-engine.service';
import { QueueService } from '../queue.service';
import { EventsGateway } from '../../events/events.gateway';

@Processor('incoming-messages')
export class IncomingMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(IncomingMessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private contactsService: ContactsService,
    private flowEngine: FlowEngineService,
    private queueService: QueueService,
    private eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<{
    accountId: string;
    senderId: string;
    recipientId: string;
    text?: string;
    mid?: string;
    postbackPayload?: string;
    timestamp?: number;
  }>) {
    const { accountId, senderId, text, postbackPayload } = job.data;

    this.logger.log(`Processing incoming message for account ${accountId} from ${senderId}`);

    const contact = await this.contactsService.findOrCreateContact(
      accountId,
      senderId,
    );

    let conversation = await this.prisma.conversation.findFirst({
      where: { accountId, contactId: contact.id },
    });

    let isFirstMessage = false;

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          accountId,
          contactId: contact.id,
          status: 'bot',
        },
      });
      isFirstMessage = true;

      const botConfig = await this.prisma.botConfig.findUnique({
        where: { accountId },
      });

      if (botConfig?.welcomeMessage) {
        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'out',
            type: 'text',
            content: { text: botConfig.welcomeMessage },
          },
        });

        await this.queueService.addOutgoingMessage({
          accountId,
          conversationId: conversation.id,
          recipientId: senderId,
          type: 'text',
          text: botConfig.welcomeMessage,
        });
      }
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'in',
        type: 'text',
        content: { text: text || postbackPayload || '' },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const flowResponse = await this.flowEngine.processMessage(
      accountId,
      text || '',
      conversation.id,
      isFirstMessage,
      postbackPayload,
    );

    if (flowResponse.handoff) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'human' },
      });

      this.eventsGateway.notifyConversationUpdate(accountId, conversation.id, 'human');
    } else {
      if (flowResponse.text) {
        await this.queueService.addOutgoingMessage({
          accountId,
          conversationId: conversation.id,
          recipientId: senderId,
          type: 'text',
          text: flowResponse.text,
        });
      }
    }

    this.eventsGateway.notifyNewMessage(accountId, conversation.id, {
      direction: 'in',
      type: 'text',
      content: { text: text || postbackPayload || '' },
      contactId: contact.id,
    });

    return { conversationId: conversation.id, contactId: contact.id };
  }

  async onFailed(job: Job, error: Error, prev?: string) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    await this.prisma.log.create({
      data: {
        accountId: job.data.accountId,
        level: 'error',
        message: `Incoming message processing failed: ${error.message}`,
        meta: { jobId: job.id, senderId: job.data.senderId },
      },
    });
  }

  async onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${JSON.stringify(result)}`);
  }
}
