import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalAccounts,
      activeAccounts,
      totalMessages,
      messagesToday,
      openConversations,
      totalContacts,
    ] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.account.count({ where: { status: 'active' } }),
      this.prisma.message.count(),
      this.prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.conversation.count({ where: { status: { in: ['bot', 'human'] } } }),
      this.prisma.contact.count(),
    ]);

    return {
      totalAccounts,
      activeAccounts,
      totalMessages,
      messagesToday,
      openConversations,
      totalContacts,
    };
  }

  async getMessagesByDay(days: number = 7) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.prisma.message.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    const grouped: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      grouped[dateStr] = 0;
    }

    for (const msg of messages) {
      const dateStr = msg.createdAt.toISOString().split('T')[0];
      if (grouped[dateStr] !== undefined) {
        grouped[dateStr] += msg._count.id;
      }
    }

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMessagesByAccount() {
    const messages = await this.prisma.message.groupBy({
      by: ['conversationId'],
      _count: { id: true },
    });

    const conversations = await this.prisma.conversation.findMany({
      select: { id: true, accountId: true, account: { select: { name: true } } },
    });

    const conversationMap = new Map(conversations.map((c) => [c.id, c]));

    const accountCounts: Record<string, { name: string; count: number }> = {};

    for (const msg of messages) {
      const conv = conversationMap.get(msg.conversationId);
      if (conv) {
        const accountId = conv.accountId;
        if (!accountCounts[accountId]) {
          accountCounts[accountId] = { name: conv.account.name, count: 0 };
        }
        accountCounts[accountId].count += msg._count.id;
      }
    }

    return Object.entries(accountCounts).map(([accountId, data]) => ({
      accountId,
      name: data.name,
      count: data.count,
    }));
  }

  async getConversationsByStatus() {
    const result = await this.prisma.conversation.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return result.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  }
}
