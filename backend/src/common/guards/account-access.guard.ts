import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const accountId = request.params.accountId;

    if (!user || !accountId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'superadmin') {
      return true;
    }

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new ForbiddenException('Account not found');
    }

    return true;
  }
}
