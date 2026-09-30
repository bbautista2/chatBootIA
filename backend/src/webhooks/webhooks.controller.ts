import { Controller, Get, Post, Req, Res, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get('instagram')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.webhooksService.verifyMetaWebhook(mode, token, challenge);
  }

  @Post('instagram')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = req.body;

    const isValid = this.webhooksService.validateSignature(body, signature);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    try {
      const result = await this.webhooksService.processWebhookEvent(body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(200).json({ status: 'error' });
    }
  }

  @Get('instagram/test')
  testWebhook() {
    return { status: 'ok', message: 'Webhook endpoint is working' };
  }
}
