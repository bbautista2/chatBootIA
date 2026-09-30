import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { FlowsModule } from './flows/flows.module';
import { FlowEngineModule } from './flow-engine/flow-engine.module';
import { MessagesModule } from './messages/messages.module';
import { ContactsModule } from './contacts/contacts.module';
import { AiIntegrationModule } from './ai-integration/ai-integration.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QueueModule } from './queue/queue.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    WebhooksModule,
    FlowsModule,
    FlowEngineModule,
    MessagesModule,
    ContactsModule,
    AiIntegrationModule,
    DashboardModule,
    QueueModule,
    EventsModule,
  ],
})
export class AppModule {}
