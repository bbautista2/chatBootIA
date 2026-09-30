import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const AccountId = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const accountId = request.params.accountId;

    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    return accountId;
  },
);
