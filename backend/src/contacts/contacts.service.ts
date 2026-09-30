import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAllByAccount(accountId: string, query: PaginationQueryDto, tags?: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { accountId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { igScopedId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagArray };
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { conversations: true } },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(accountId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, accountId },
      include: {
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          include: {
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async updateTags(accountId: string, contactId: string, tags: string[]) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, accountId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id: contactId },
      data: { tags },
    });
  }

  async findOrCreateContact(accountId: string, igScopedId: string, name?: string) {
    let contact = await this.prisma.contact.findFirst({
      where: { accountId, igScopedId },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          accountId,
          igScopedId,
          name,
          tags: ['new'],
        },
      });
    } else if (name && contact.name !== name) {
      contact = await this.prisma.contact.update({
        where: { id: contact.id },
        data: { name },
      });
    }

    return contact;
  }
}
