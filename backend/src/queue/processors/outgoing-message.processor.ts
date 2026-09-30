import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../../accounts/accounts.service';
import axios from 'axios';

@Processor('outgoing-messages')
export class OutgoingMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(OutgoingMessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private accountsService: AccountsService,
  ) {
    super();
  }

  async process(job: Job<{
    accountId: string;
    conversationId: string;
    recipientId: string;
    type: string;
    text?: string;
    imageUrl?: string;
    buttons?: Array<{ title: string; payload: string }>;
  }>) {
    const { accountId, conversationId, recipientId, type, text, imageUrl, buttons } = job.data;

    this.logger.log(`Sending outgoing message for account ${accountId} to ${recipientId}`);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await this.accountsService.getAccessToken(accountId);

    let requestBody: any;

    switch (type) {
      case 'text':
        requestBody = {
          recipient: { id: recipientId },
          message: { text },
        };
        break;

      case 'image':
        requestBody = {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'image',
              payload: { url: imageUrl },
            },
          },
        };
        break;

      case 'interactive':
        requestBody = {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: text || '',
                buttons: buttons?.map((btn) => ({
                  type: 'postback',
                  title: btn.title,
                  payload: btn.payload,
                })) || [],
              },
            },
          },
        };
        break;
    }

    if (requestBody) {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${account.igUserId}/messages`,
        requestBody,
        {
          params: { access_token: accessToken },
        },
      );

      this.logger.log(`Message sent successfully: ${JSON.stringify(response.data)}`);

      await this.prisma.message.create({
        data: {
          conversationId,
          direction: 'out',
          type: type as any,
          content: { text, imageUrl, buttons },
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return response.data;
    }
  }

  async onFailed(job: Job, error: Error, prev?: string) {
    this.logger.error(`Outgoing job ${job.id} failed: ${error.message}`);

    await this.prisma.log.create({
      data: {
        accountId: job.data.accountId,
        level: 'error',
        message: `Failed to send outgoing message: ${error.message}`,
        meta: { jobId: job.id, recipientId: job.data.recipientId },
      },
    });
  }

  async onCompleted(job: Job, result: any) {
    this.logger.log(`Outgoing job ${job.id} completed`);
  }
}
