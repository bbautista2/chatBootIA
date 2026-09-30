import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, UpdateBotConfigDto } from './dto/create-account.dto';
import * as crypto from 'crypto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private encrypt(text: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    try {
      const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!';
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      return decrypted;
    } catch {
      return encryptedText;
    }
  }

  async findAll(userId: string, userRole: string) {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: { botConfig: true },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { botConfig: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async create(dto: CreateAccountDto) {
    const existing = await this.prisma.account.findUnique({
      where: { igUserId: dto.igUserId },
    });

    if (existing) {
      throw new BadRequestException('Instagram User ID already registered');
    }

    const encryptedToken = this.encrypt(dto.accessToken);

    const account = await this.prisma.account.create({
      data: {
        name: dto.name,
        igUserId: dto.igUserId,
        pageId: dto.pageId,
        accessToken: encryptedToken,
        tokenExpiresAt: dto.tokenExpiresAt ? new Date(dto.tokenExpiresAt) : null,
        status: dto.status || 'active',
      },
      include: { botConfig: true },
    });

    await this.prisma.botConfig.create({
      data: {
        accountId: account.id,
        aiEnabled: false,
        fallbackMessage: 'Lo siento, no pude procesar tu mensaje.',
      },
    });

    return this.findOne(account.id);
  }

  async update(id: string, dto: UpdateAccountDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.accessToken) {
      data.accessToken = this.encrypt(dto.accessToken);
    }
    if (dto.tokenExpiresAt) {
      data.tokenExpiresAt = new Date(dto.tokenExpiresAt);
    }

    await this.prisma.account.update({
      where: { id },
      data,
    });

    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    await this.prisma.account.update({
      where: { id },
      data: { status: 'inactive' },
    });
    return { message: 'Account deactivated' };
  }

  async getBotConfig(accountId: string) {
    await this.findOne(accountId);

    const config = await this.prisma.botConfig.findUnique({
      where: { accountId },
    });

    if (!config) {
      throw new NotFoundException('Bot config not found');
    }

    return config;
  }

  async updateBotConfig(accountId: string, dto: UpdateBotConfigDto) {
    await this.findOne(accountId);

    const config = await this.prisma.botConfig.findUnique({
      where: { accountId },
    });

    if (!config) {
      throw new NotFoundException('Bot config not found');
    }

    await this.prisma.botConfig.update({
      where: { accountId },
      data: dto,
    });

    return this.getBotConfig(accountId);
  }

  async getAccessToken(accountId: string): Promise<string> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { accessToken: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.decrypt(account.accessToken);
  }
}
