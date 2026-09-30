import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('incoming-messages') private incomingQueue: Queue,
    @InjectQueue('outgoing-messages') private outgoingQueue: Queue,
  ) {}

  async addIncomingMessage(data: {
    accountId: string;
    senderId: string;
    recipientId: string;
    text?: string;
    mid?: string;
    postbackPayload?: string;
    timestamp?: number;
  }) {
    await this.incomingQueue.add('process', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addOutgoingMessage(data: {
    accountId: string;
    conversationId: string;
    recipientId: string;
    type: string;
    text?: string;
    imageUrl?: string;
    buttons?: Array<{ title: string; payload: string }>;
  }) {
    await this.outgoingQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async getIncomingQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.incomingQueue.getWaitingCount(),
      this.incomingQueue.getActiveCount(),
      this.incomingQueue.getCompletedCount(),
      this.incomingQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  async getOutgoingQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.outgoingQueue.getWaitingCount(),
      this.outgoingQueue.getActiveCount(),
      this.outgoingQueue.getCompletedCount(),
      this.outgoingQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
