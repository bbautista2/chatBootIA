import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  verifyMetaWebhook(mode: string, token: string, challenge: string) {
    const verifyToken = this.configService.get<string>('META_VERIFY_TOKEN', '');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return { 'hub.challenge': challenge };
    }

    throw new BadRequestException('Webhook verification failed');
  }

  validateSignature(body: any, signature: string): boolean {
    const appSecret = this.configService.get<string>('META_APP_SECRET', '');
    if (!appSecret) {
      this.logger.warn('META_APP_SECRET not configured, skipping signature validation');
      return true;
    }

    if (!signature) {
      return false;
    }

    const expectedSignature = signature.replace('sha256=', '');
    const bodyString = JSON.stringify(body);
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(bodyString);
    const digest = hmac.digest('hex');

    return expectedSignature === digest;
  }

  async processWebhookEvent(body: any) {
    const object = body.object;

    if (object !== 'instagram') {
      return { status: 'ignored' };
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const pageId = entry.id;
      const messaging = entry.messaging || [];

      for (const event of messaging) {
        await this.processMessagingEvent(pageId, event);
      }
    }

    return { status: 'ok' };
  }

  private async processMessagingEvent(pageId: string, event: any) {
    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;
    const timestamp = event.timestamp;

    if (!senderId || !recipientId) {
      return;
    }

    const account = await this.prisma.account.findFirst({
      where: { pageId },
    });

    if (!account) {
      this.logger.warn(`No account found for pageId: ${pageId}`);
      return;
    }

    if (event.message) {
      const messageData = {
        accountId: account.id,
        senderId,
        recipientId,
        type: 'message',
        text: event.message.text || null,
        mid: event.message.mid || null,
        attachments: event.message.attachments || [],
        timestamp,
      };

      await this.prisma.log.create({
        data: {
          accountId: account.id,
          level: 'info',
          message: `Incoming message from ${senderId}`,
          meta: { senderId, text: event.message.text },
        },
      });
    }

    if (event.postback) {
      const postData = {
        accountId: account.id,
        senderId,
        recipientId,
        type: 'postback',
        payload: event.postback.payload,
        title: event.postback.title,
        timestamp,
      };

      await this.prisma.log.create({
        data: {
          accountId: account.id,
          level: 'info',
          message: `Postback from ${senderId}`,
          meta: { senderId, payload: event.postback.payload },
        },
      });
    }
  }
}
