import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { IncomingMessageProcessor } from './processors/incoming-message.processor';
import { OutgoingMessageProcessor } from './processors/outgoing-message.processor';
import { AccountsModule } from '../accounts/accounts.module';
import { ContactsModule } from '../contacts/contacts.module';
import { FlowEngineModule } from '../flow-engine/flow-engine.module';
import { MessagesModule } from '../messages/messages.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'incoming-messages' },
      { name: 'outgoing-messages' },
    ),
    AccountsModule,
    ContactsModule,
    FlowEngineModule,
    forwardRef(() => MessagesModule),
    EventsModule,
  ],
  providers: [QueueService, IncomingMessageProcessor, OutgoingMessageProcessor],
  exports: [QueueService],
})
export class QueueModule {}
