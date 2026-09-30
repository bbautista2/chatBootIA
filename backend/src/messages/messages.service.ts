import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { SendMessageDto } from './dto/send-message.dto';
import axios from 'axios';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private accountsService: AccountsService,
  ) {}

  async findByConversation(conversationId: string, page: number = 1, limit: number = 50) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async send(conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { account: true, contact: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: 'out',
        type: dto.type,
        content: {
          text: dto.text,
          imageUrl: dto.imageUrl,
          buttons: dto.buttons,
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    this.sendToInstagram(conversation.account.igUserId, conversation.account.id, dto).catch(
      (error) => {
        this.logger.error(`Failed to send message to Instagram: ${error.message}`);
      },
    );

    return message;
  }

  async sendToInstagram(igUserId: string, accountId: string, dto: SendMessageDto) {
    try {
      const accessToken = await this.accountsService.getAccessToken(accountId);

      let requestBody: any;

      switch (dto.type) {
        case 'text':
          requestBody = {
            recipient: { id: dto.recipientId },
            message: { text: dto.text },
          };
          break;

        case 'image':
          requestBody = {
            recipient: { id: dto.recipientId },
            message: {
              attachment: {
                type: 'image',
                payload: { url: dto.imageUrl },
              },
            },
          };
          break;

        case 'interactive':
          requestBody = {
            recipient: { id: dto.recipientId },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'button',
                  text: dto.text || '',
                  buttons: dto.buttons?.map((btn) => ({
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
          `https://graph.facebook.com/v19.0/${igUserId}/messages`,
          requestBody,
          {
            params: { access_token: accessToken },
          },
        );

        this.logger.log(`Message sent to Instagram: ${JSON.stringify(response.data)}`);
        return response.data;
      }
    } catch (error) {
      this.logger.error(`Instagram API error: ${error.message}`);
      throw error;
    }
  }

  async findByAccountWithPagination(accountId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const conversations = await this.prisma.conversation.findMany({
      where: { accountId },
      include: {
        contact: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.conversation.count({
      where: { accountId },
    });

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
